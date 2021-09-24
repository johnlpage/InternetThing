package com.mongodb.jlp.tstest;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Date;
import java.util.ArrayList;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.UpdateOneModel;

import com.mongodb.client.model.UpdateOptions;

public class WriteWorker implements Runnable {

	Logger logger;
	int threadId;
	int nCalls;
	int devicemin;
	int devicemax;
	int mode;
	MongoCollection<Document> coll;
	Document notfull = new Document("$lt", 200);
	Document addone = new Document("size", 1);
	UpdateOptions options = new UpdateOptions().upsert(true);
	public static final int frequencyms = 5000; /* 5 second */

	/* Simulates N devices inserting X Documents */

	WriteWorker(int threadid, int mode, MongoCollection<Document> coll, int ncalls, int devicemin, int devicemax) {
		logger = LoggerFactory.getLogger(WriteWorker.class);

		this.threadId = threadid;
		this.nCalls = ncalls;
		this.devicemin = devicemin;
		this.devicemax = devicemax;
		this.coll = coll;
		this.mode = mode;
	}

	public void run() {
		logger.info("Starting Writer");
		String vnames[] = { "ax", "ay", "az", "gx", "gy", "gz", "mx", "my", "mz" };

		/* This writes recordss siimulating a 9 DOF accelerometer for many devices */
		/*
		 * We write as fast as possible - this helps us determine how many devices we
		 * might have but also spread the data out over a long time period
		 */
		int r = 0;
		long firstDate = new Date().getTime();

		ArrayList<Document> buffer = new ArrayList<Document>();
		Double dNcalls = new  Double(nCalls);
		for (int x = 0; x < nCalls; x++) {
			Double val =  Math.sin( (new Double(x) * 6.28) / dNcalls);
			
			for (int d = devicemin; d <= devicemax; d++) {
				Document doc = new Document("device", d);
				doc.append("ts", new Date(firstDate + x * frequencyms));
				for (String f : vnames) {
					doc.append(f,val+d);
				}
				buffer.add(doc);
				r++;
			}
			if (mode == 3) {
				bucketInsertMany(buffer);
			} else {
				coll.insertMany(buffer);
			}
			buffer.clear();
		}
		logger.info("{} Readings written by thread", r);
	}

	/* Doing timeseries in the simplest "old" "smart" way */

	void bucketInsertMany(ArrayList<Document> docs) {
		ArrayList<UpdateOneModel<Document>> upserts = new ArrayList<UpdateOneModel<Document>>();
		for (Document d : docs) {
			Document query = new Document("device", d.get("device")).append("size", notfull);
			d.remove("_id");
			d.remove("device");
			Document update = new Document("$push", new Document("readings", d));
			update.append("$inc", addone);
			update.append("$min", new Document("mints", d.get("ts")));
			update.append("$max", new Document("maxts", d.get("ts")));
			upserts.add(new UpdateOneModel<Document>(query, update, options));

		}
		coll.bulkWrite(upserts);
	}

}
