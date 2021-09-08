from bluepy.btle import Scanner, Service, Characteristic, DefaultDelegate, Peripheral
from pprint import pprint
from pymongo import MongoClient
import csv
import datetime
import time
import struct

DEVICENAME = "InternetThing"
SERVICEUUID = "90db"
CHARUUID = "d0c5"

conn_str = ""
configfile = "/home/pi/connstr.txt"
collection = None
writebatch = []
BATCHLEN=1 

values = ["ax","ay","az","gx","gy","gz","mx","my","mz"]
scale = [1000,1000,1000,2,2,2,10,10,10]

def create_timeseries_collection(client):
    try:
        client.blescan.create_collection("raw",timeseries = { "timeField": "ts", "metaField": "device"})
        
    except Exception as e:
        print(e) 

def connect_to_mongoDB():
    global collection
    try:
        with open(configfile, "r") as c:
            try:
                conn_str = c.readline().strip()
            except Exception as e:
                print(e)  # No readable config
        client = MongoClient(conn_str)
        create_timeseries_collection(client)
        collection = client.blescan.raw
    except Exception as e:
        print(e)
        collection = None


def flush_batch():
    global writebatch
    if len(writebatch) > 0:
        collection.insert_many(writebatch)
        writebatch = []


def write_to_mongoDB(doc):
    global writebatch

    if collection == None:
        connect_to_mongoDB()

    doc["ts"]=datetime.datetime.utcnow();
    doc["device"] = "thing1" 
    writebatch.append(doc)
    if len(writebatch) > BATCHLEN: 
        flush_batch()


class NotifyDelegate(DefaultDelegate):
    def __init__(self, params):
        DefaultDelegate.__init__(self)

    #TODO: REFACTOR to handle missing data
    def handleNotification(self, cHandle, data):
        rec = {}
        c=0
        for valname in values:
            value = int.from_bytes(data[c*2:c*2+2], "little")
            if value > 0:
                rec[valname] = (value - 5000) / scale[c]
            c=c+1

        write_to_mongoDB(rec)


class ScanDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)

    def handleDiscovery(self, dev, isNewDev, isNewData):
        pass


def find_thing():

    scanner = Scanner().withDelegate(ScanDelegate())
    sensor = None

    while sensor == None:
        print("Scanning")
        devices = scanner.scan(5.0)
        print("Scan Complete")

        for dev in devices:
            #print(f"Device {dev.addr} {dev.addrType}, RSSI={dev.rssi} dB")
            doc = {
                "addr": dev.addr,
                "atype": dev.addrType,
                "rssi": dev.rssi,
                "ts": datetime.datetime.utcnow(),
            }
            for (adtype, desc, value) in dev.getScanData():
                #print(f"{desc} : {value}")
                if DEVICENAME in value:
                    sensor = dev
    print("Found a thing")
    return sensor


def connect_to_thing(device):
    thing = None
    while thing == None:
        print("Tying to connect")
        try:
            thing = Peripheral(sensor)
            print("Connected")
        except Exception as e:
            print(e)
            time.sleep(1)

    try:
        services = thing.getServices()
    except Exception as e:
        print(e)
        thing = None
        return
        # Bluetooth LE breaks a lot

    thing.setDelegate(NotifyDelegate(None))
    try:
        thingService = thing.getServiceByUUID(SERVICEUUID)  # Mon90DB
        motionCharacteristics = thingService.getCharacteristics(forUUID=CHARUUID)  # Docs
        configHandle = motionCharacteristics[0].getHandle() + 1
        thing.writeCharacteristic(configHandle, b"\x01\x00")
        print("SUBSCRIBED")
        return thing
    except Exception as e:
        print("thing is missing services?")
        print(e)
        try:
            thing.disconnect()
        except:
            pass
        thing = None
        return
        # Bluetooth LE breaks a lot
    return thing


if __name__ == "__main__":

    print("Looking for a suitable thing")
    sensor = None
    thing = None

    while True:
        if sensor == None:
            sensor = find_thing()

        if thing == None:
            thing = connect_to_thing(sensor)
        else:
            try:
                if thing.waitForNotifications(0.5) == False:
                    flush_batch()  # Nothing new
            except Exception as e:
                pprint(e)
                thing = None
