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

EXPONENTIAL SMOOTHING - OLDER records have less impacct so you see a change quicket


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