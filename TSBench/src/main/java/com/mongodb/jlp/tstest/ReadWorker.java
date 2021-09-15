package com.mongodb.jlp.tstest;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.Date;
import java.util.concurrent.ThreadLocalRandom;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.model.UpdateOptions;

public class ReadWorker implements Runnable {

	Logger logger;
	int threadId;
	int nCalls;
	int devicemin;
	int devicemax;
	int mode;
	long starttime;
	long endtime;
	MongoCollection<Document> coll;
	final int SECONDSTOREAD = 5;

	/* Simulates N devices inserting X Documents */

	ReadWorker(int threadid, Date starttime, Date endtime, int mode, MongoCollection<Document> coll, int ncalls,
			int devicemin, int devicemax) {
		logger = LoggerFactory.getLogger(ReadWorker.class);

		this.threadId = threadid;
		this.nCalls = ncalls;
		this.devicemin = devicemin;
		this.devicemax = devicemax;
		this.coll = coll;
		this.mode = mode;
		this.starttime = starttime.getTime(); // Millis since 1970
		this.endtime = endtime.getTime();
	}

	public void run() {
		logger.info("Starting Reader");
		/* Pick a device, read all sensor readings in a time span */
		/*
		 * We are writing quickly so we only want to read a few seconds of of data - say
		 * 5 seconds
		 */
		int r = 0;
		for (int c = 0; c < nCalls; c++) {
			// TODO handle dynamic -> long now = new Date().getTime();
			long datafrom = ThreadLocalRandom.current().nextLong(starttime, endtime);
			int device = ThreadLocalRandom.current().nextInt(devicemin, devicemax);
			MongoCursor<Document> cursor = null;
			/* TS and Simple Collection */

			Date from = new Date(datafrom);
			Date to = new Date(datafrom + SECONDSTOREAD * 1000);

			if (mode == 1 || mode == 2) {
				Document query = new Document("device", device).append("ts",
						new Document("$gt", from).append("$lt", to));

				cursor = coll.find(query).iterator();
			} else {
				/* Bucketed - using aggregation to reshape docs server side */

				/* We have a maxts and mints - this isn't optimal querying as it's two ranges */
				Document query = new Document("device", device);
				// If a bucket ends before our lowest time we can ignore it
				query.append("maxts", new Document("$gte", from));
				// If a bucket stars after out last time we can ignore it
				query.append("mints", new Document("$lte", to));
				new Document("$gt", new Date(datafrom)).append("$lt", from);

				Document findbuckets = new Document("$match", query);
				Document flattenbuckets = new Document("$unwind", "$readings");
				Document filterreadings = new Document("$match",
						new Document("readings.ts", new Document("$gt", from).append("$lt", to)));
				cursor = coll.aggregate(Arrays.asList(findbuckets, flattenbuckets, filterreadings)).iterator();
				/*
				 * if (!cursor.hasNext()) { logger.error("No results"); logger.error( new
				 * Document("q", Arrays.asList(findbuckets, flattenbuckets,
				 * filterreadings)).toJson()); System.exit(1); }
				 */

			}

			try {

				while (cursor.hasNext()) {
					cursor.next();
					r++;

				}
			} finally {
				cursor.close();
			}
		}
		logger.info("{} Readings retrieved by thread", r);
	}

}
