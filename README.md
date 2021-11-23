# InternetThing

This is an internet connected ORB intended to demonstrate TimeSeries functionality in MongoDB 5.0 It serves no practical purpose, except to get people to dance like John Travolta at the MongoDB booth.

## Arduino
Code to write to an Arduino Nano BLE 33 (Model matters as this has the 9axis IMU in it) - setup Arduino IDE, open an upload.
Modify Device ID to a unique value at the start (Must start MongoThing_), this will be used in the database as device field.

## BLEGateway
Python code to listen for nearby MongoThing devices and uploads their data to Atlas. Must be run as Root on a Raspberry Pi (Other linux probably works, other platforms *may* work)
Reads $HOME/connstr.txt for its connection string. Suggest using `w=0` for lowest latency writes

## Realm
Contains a Realm app that includes a GUI for viewing this data and testing live window fucntions. All of the app is in the hosting page (you can also run locally with `python -m http.server` in the files directory)

## TSBench
Some multi threaded Java code I used to compare the performance for read and write of TimeSeries collections, non-TimeSeries collections and manual bucketing. Demonstrates worst-case scenario for write performance for TS & Bucketing. Use this to compare to [TSBS](https://github.com/timescale/tsbs) which is a more complete benchmark.
