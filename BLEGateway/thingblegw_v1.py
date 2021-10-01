from bluepy.btle import Scanner, Service, Characteristic, DefaultDelegate, Peripheral
from pprint import pprint
from pymongo import MongoClient
import csv
import datetime
import time
import struct
import math

DEVICENAME = "MongoThing_"
SERVICEUUID = "90db"
CHARUUID = "d0c5"

conn_str = ""
configfile = "/home/pi/connstr.txt"
collection = None
writebatch = []
BATCHLEN=1 

device_names = {}

values = ["ax","ay","az","gx","gy","gz","mx","my","mz"]
scale = [1000,1000,1000,2,2,2,10,10,10]
metric_count=0

def create_timeseries_collection(client):
    try:
        client.blescan.create_collection("raw",timeseries = { "timeField": "ts", "metaField": "device"})    
    except Exception as e:
        print(e) 
    client.blescan.raw.create_index([("ts",1)])
    client.blescan.raw.create_index([("device",1),("ts",1)])

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
    global metric_count
    if len(writebatch) > 0:
        try:
            rval = collection.insert_many(writebatch)
            metric_count +=  1;
            #print(metric_count)
            #pprint(rval.inserted_ids)
        except Exception as e:
            pprint(e)
        writebatch = []


def write_to_mongoDB(doc):
    global writebatch
    if collection == None:
        connect_to_mongoDB()

    doc["ts"]=datetime.datetime.utcnow();
 
    writebatch.append(doc)
    if len(writebatch) > BATCHLEN: 
        flush_batch()


class NotifyDelegate(DefaultDelegate):
    def __init__(self, deviceaddr):
        DefaultDelegate.__init__(self)
        self.deviceaddr = deviceaddr

    #TODO: REFACTOR to handle missing data
    def handleNotification(self, cHandle, data):
        rec = {}
        c=0
        for valname in values:
            value = int.from_bytes(data[c*2:c*2+2], "little")
            if value > 0:
                rec[valname] = (value - 5000) / scale[c]
            else:
                print(value)
            c=c+1

        #Compute Heading and Angle here
        #The edge may not be able to but the gateway can
        #In this case atan2 might not be native (actually it is)
        try:
            rec['in'] = math.atan2(rec['mz'], rec['my']) * 57.2957795;
            direction =  math.atan2(rec['my'], rec['mx']) * 57.2957795 * 3  -180 ;
            rec['hd'] = direction;
            #pprint(rec)
        except Exception as e:
            print(e)
            pprint(rec);
          
        rec['bluetooth_addr'] = self.deviceaddr;
        rec['device'] = device_names[self.deviceaddr];

        write_to_mongoDB(rec)


class ScanDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)

    def handleDiscovery(self, dev, isNewDev, isNewData):
        pass


def find_thing():
  
    global device_names
    scanner = Scanner().withDelegate(ScanDelegate())
    sensor = None

    while sensor == None:
        print("Scanning")
        devices = scanner.scan(5.0)
        print("Scan Complete")

        for dev in devices:
            #print(f"Device {dev.addr} {dev.addrType}, RSSI={dev.rssi} dB")
            for (adtype, desc, value) in dev.getScanData():
                #print(f"{desc} : {value}")
                if value.startswith(DEVICENAME):
                    sensor = dev
                    device_names[dev.addr] = value
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

    thing.setDelegate(NotifyDelegate(device.addr))
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
