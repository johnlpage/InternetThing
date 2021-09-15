package com.mongodb.jlp.tstest;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.CreateCollectionOptions;
import com.mongodb.client.model.TimeSeriesOptions;
import com.mongodb.client.MongoCollection;

import java.util.logging.LogManager;
import java.util.Date;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class TSTest {
	static final String version = "0.0.1";
	static Logger logger;

	public static void main(String[] args) {
		LogManager.getLogManager().reset();

		SLF4JBridgeHandler.removeHandlersForRootLogger();
		SLF4JBridgeHandler.install();

		logger = LoggerFactory.getLogger(TSTest.class);
		logger.info(version);
		MongoCollection<Document> readings;
		int nCalls = 1000;
		int nThreads = 20;
		int devicesPerThread = 10;
		int mode = 1;
		String uri = "";

		if (args.length > 0) {
			uri = new String(args[0]);
		} else {
			System.out
					.println("Usage: java -jar TSTests.jar <mongodb URI> [ncalls] [threads] [devicesperthread] [mode]");
			return;
		}
		if (args.length > 1) {
			nCalls = Integer.parseInt(args[1]);
		}
		if (args.length > 2) {
			nThreads = Integer.parseInt(args[2]);
		}

		if (args.length > 3) {
			devicesPerThread = Integer.parseInt(args[3]);
		}

		if (args.length > 4) {
			mode = Integer.parseInt(args[4]);

		}

		MongoClient mongoClient = MongoClients.create(uri);
		MongoDatabase database = mongoClient.getDatabase("tstest");
		readings = database.getCollection("readings");

		ExecutorService writepool = Executors.newFixedThreadPool(nThreads + 1);
		ExecutorService readpool = Executors.newFixedThreadPool(nThreads + 1);
		long start = System.currentTimeMillis();

		logger.info("Write Test");

		readings.drop();

		switch (mode) {
			case 1:
				logger.info("Simple Insert Mode");
				readings.createIndex(new Document("device", 1).append("ts", 1));
				break;

			case 2:
				logger.info("Timeseries Mode");
				CreateCollectionOptions options = new CreateCollectionOptions();
				options.timeSeriesOptions(new TimeSeriesOptions("ts").metaField("device"));
				database.createCollection("readings", options);
				break;

			case 3:
				logger.info("Manual Bucket Mode");
				readings.createIndex(new Document("device", 1).append("size", 1));
				readings.createIndex(new Document("device", 1).append("mints", 1).append("maxts", 1));
				break;

			default:
				logger.error("Unknown mode - exiting");
				System.exit(1);

		}

		/* Write Only */

		Date writestart = new Date(); // Times writes start at
		Date writesend = null;
		for (int i = 0; i <= nThreads; i++) {
			writepool.execute(
					new WriteWorker(i, mode, readings, nCalls, i * devicesPerThread, ((i + 1) * devicesPerThread) - 1));
		}

		writepool.shutdown();

		try {
			writepool.awaitTermination(Long.MAX_VALUE, TimeUnit.SECONDS);
			long end = System.currentTimeMillis();
			logger.info("Write Test: Time Taken " + (end - start) + " ms");
			writepool.shutdown();
			writesend = new Date();
		} catch (InterruptedException e) {
			logger.error(e.getMessage());

		}

		logger.info("Read Test");
		start = System.currentTimeMillis();
		/* Read Only */

		for (int i = 0; i < nThreads; i++) {
			readpool.execute(new ReadWorker(i, writestart, writesend, mode, readings, nCalls, i * devicesPerThread,
					((i + 1) * devicesPerThread) - 1));
		}

		readpool.shutdown();

		try {
			readpool.awaitTermination(Long.MAX_VALUE, TimeUnit.SECONDS);
			long end = System.currentTimeMillis();
			logger.info("Read Test: Time Taken " + (end - start) + " ms");
			readpool.shutdown();
		} catch (InterruptedException e) {
			logger.error(e.getMessage());
		}

		logger.info("Read Write Test");

		writepool = Executors.newFixedThreadPool(nThreads + 1);
		readpool = Executors.newFixedThreadPool(nThreads + 1);

		start = System.currentTimeMillis();
		for (int i = 0; i <= nThreads; i++) {
			writepool.execute(
					new WriteWorker(i, mode, readings, nCalls, i * devicesPerThread, ((i + 1) * devicesPerThread) - 1));
		}
		for (int i = 0; i < nThreads; i++) {
			readpool.execute(new ReadWorker(i, writestart, writesend, mode, readings, nCalls, i * devicesPerThread,
					((i + 1) * devicesPerThread) - 1));
		}
		writepool.shutdown();
		readpool.shutdown();

		try {
			writepool.awaitTermination(Long.MAX_VALUE, TimeUnit.SECONDS);
			readpool.awaitTermination(Long.MAX_VALUE, TimeUnit.SECONDS);
			long end = System.currentTimeMillis();
			logger.info("Read Test: Time Taken " + (end - start) + " ms");
			readpool.shutdown();
		} catch (InterruptedException e) {
			logger.error(e.getMessage());
		}

	}

}
