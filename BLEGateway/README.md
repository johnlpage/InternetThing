Setup Python 3 as default on a Pi is 2.7

```
sudo    apt-get install python3-venv
python3 -m venv .
source bin/activate
```

Install required modules

* bluepy
* pymongo
* dnspython

```
pip install -r requirements.txt
```

Successfully installed bluepy-1.3.0 pymongo-3.12.0

Run as root (or che=ange your Pi to allow non root BLE scanning)

```
sudo bin/python thingblegw.py
```


Example Window Functions
--------------------------

Simple average of heading - required as heading is Really jumpy

For example for each data point we can take the average of it and the 50 befor it to smooth out something like rotation speed
its hard to turn something like this smoothly by hand so something showing soeed is better averaged, we could alos use that better if we were calculating the total are under that graph for distance/enegrgy

Simple smoothing X rotation

{
  "$setWindowFields": {
    "sortBy": {
      "ts": 1
    },
    "output": {
      "value": {
        "$avg": "$gx",
        "window": {
          "documents": [
            -50,
            "current"
          ]
        }
      }
    }
  }
}

But a simple average like that means a change take a long time to show up - what if we made more recent value weight more heavily

EXPONENTIAL SMOOTHING - OLDER records have less impacct so you see a change quicket


{
  "$setWindowFields": {
    "sortBy": {
      "ts": 1
    },
    "output": {
      "value": {
        "$expMovingAvg": {
          input: "$gy",
          N: 50
        }
      }
    }
  }
}

 mongosh mongosh "mongodb+srv://cluster0.4rfwx.mongodb.net/myFirstDatabase" --apiVersion 1 --username blescan


  [{"$match":{"device":"MongoThing_001","ts":{"$gt":"2021-10-04T10:49:13.643Z"}}},{"$setWindowFields":{"sortBy":{"ts":1},"output":{"value":{"$expMovingAverage":{"input":"$gy","N":50}}}}},{"$match":{"ts":{"$gt":"2021-10-04T10:49:18.033Z"}}},{"$project":{"value":1,"ts":1,"message":1,"_id":0}}]

