# InternetThing

This is an internet connected ORB intended to demonstrate TimeSeries functionality in MongoDB 5.0 It servers no practical purpose.

Arduino:
   Code to write to an Arduino Nano BLE 33 (Model matters at this has the 9axis IMU in it) - setup Arduino IDE, open an upload.
   Modify Device ID to a unique value at the start (Must start MongoThing_), this will be used in the database as deveice field.

BLEGateway
   Python code to listen for nearby MongoTHing devices and puload their data to Atlas. Must be run as Root on a Raspberry Pi (Other linux probably works, other platforms *may* work)
   reads $HOME/connstr.txt for its connection string. Suggest using w=0 for lowest latency writes

Realm
    Containst a Realm app that includes a GUI for viewing this data and testing live window fucntions. All app is in the hosting page (you can also run locally with `python -m htts.pserver` in the files directory)

TSBench
    Some multi threaded Java code I used to compare the performance for read and write of TimeSeries collections, Non Timeseries collections and Bucketing Manually. Demonstrates worst scenario for write performance for TS & Bucketing. Use this to compare to TSBS which is a more complete benchmark.
