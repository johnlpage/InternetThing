from bluepy.btle import Scanner, Service, Characteristic, DefaultDelegate, Peripheral
from pprint import pprint
from pymongo import MongoClient
import csv
import datetime
import time
import struct
import math
import threading

DEVICENAME = "MongoThing_"
SERVICEUUID = "90db"
CHARUUID = "d0c5"

conn_str = ""
configfile = "/home/pi/connstr.txt"
collection = None
writebatch = []
BATCHLEN=2
sent=0
values = ["ax","ay","az","gx","gy","gz","mx","my","mz"]
scale = [1000,1000,1000,2,2,2,10,10,10]
colname = "raw"

def create_timeseries_collection(client):
    try:
        #client.blescan.raw.drop()
        client.blescan.create_collection(colname,timeseries = { "timeField": "ts", "metaField": "device"})    
    except Exception as e:
        print(e) 
    client.blescan[colname].create_index([("device",1),("ts",1)])

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
        collection = client.blescan[colname]
    except Exception as e:
        print(e)
        collection = None

def flush_batch():
    global writebatch
    if len(writebatch) > 0:
        #print(len(writebatch))
        try:
            rval = collection.insert_many(writebatch,ordered=False)
        except Exception as e:
            pprint(e)
        writebatch = []

def write_to_mongoDB(doc):
    global writebatch
    if collection == None:
        connect_to_mongoDB()
    writebatch.append(doc)
    #if len(writebatch) > BATCHLEN: 
    #    flush_batch()

class NotifyDelegate(DefaultDelegate):
    def __init__(self, deviceaddr,devicename):
        DefaultDelegate.__init__(self)
        self.deviceaddr = deviceaddr
        self.devicename = devicename

    def handleNotification(self, cHandle, data):
        rec = {}
        c=0
        for valname in values:
            value = int.from_bytes(data[c*2:c*2+2], "little")
            if value > 0:
                rec[valname] = (value - 5000) / scale[c]
            c=c+1

        #Compute Heading and Angle here
        #The edge may not have atan2 but the gateway does
        try:
            rec['in'] = math.atan2(rec['mz'], rec['my']) * 57.2957795;
            direction =  math.atan2(rec['my'], rec['mx']) * 57.2957795 * 3  -180 ;
            rec['hd'] = direction;
        except Exception as e:
            print(e)
            pprint(rec);
          
        rec['bluetooth_addr'] = self.deviceaddr
        rec['device'] = self.devicename
        rec["ts"]=datetime.datetime.utcnow();

        write_to_mongoDB(rec)

#Our things dont advertise if something is connected because we made
#Them only accept one connection

class ScanDelegate(DefaultDelegate):
    def __init__(self,things):
        DefaultDelegate.__init__(self)
        self.things = things

    def handleDiscovery(self, dev, isNewDev, isNewData):          
            if isNewDev and dev.connectable:
                name = dev.getValueText(9)
                if name and name.startswith("MongoThing_"):
                    addr = dev.addr
                    print(f"Found Name: {name} Address: {addr}")
                    self.things.append({"device":dev,"name":name})
    
   


def setupThing(thingfound):
        thing = None
        name = thingfound["name"]
        device = thingfound["device"]
        try:
            print(f"Connecting to {name}...")
            thing = Peripheral(device)
            print(f"Connected to {name}")
            services = thing.getServices()
            thing.setDelegate(NotifyDelegate(device.addr,name))
            thingService = thing.getServiceByUUID(SERVICEUUID)  # Mon90DB
            motionCharacteristics = thingService.getCharacteristics(forUUID=CHARUUID)  # Docs
            configHandle = motionCharacteristics[0].getHandle() + 1
            thing.writeCharacteristic(configHandle, b"\x01\x00")
            print("SUBSCRIBED")
            return thing
        except Exception as e:
            print(e)
            #If we have a problem disconnect
            if thing:
                thing.disconnect()
            return None         


def find_things(things):
    thingsfound = []
    #Start a Scanner which will find things and add them to our array
    while len(thingsfound) == 0:
        scanner = Scanner().withDelegate(ScanDelegate(thingsfound))
        scanner.scan(10.0) #We cannot connect whilst scanning so we need to scan up front

    print(f"Setting up {len(thingsfound)} things.")
    
    for thingfound in thingsfound:
        thing = setupThing(thingfound)
        if thing:
            things.append(thing)

def reconnect_thing(thing):
    while thing['sensor'] == None:
        thing['sensor'] = setupThing(thing)

    

if __name__ == "__main__":

    print("Looking for a suitable things")
    sensor = None
    thing = None
    things = []
    

    #Start a Scanner which will find things and add them to our array
    while len(things) == 0:
        scanner = Scanner().withDelegate(ScanDelegate(things))
        scanner.scan(10.0) #We cannot connect whilst scanning so we need to scan up front

    print(f"Setting up {len(things)} things.")
    
    for thing in things:
        sensor = None
        while sensor == None:
            sensor = setupThing(thing)
            if sensor:
                thing['sensor'] = sensor


    print(f"Listening to {len(things)} things")

    #Main loop
    while True:
        #We can't let queues of BT messages build up

        for thing in things:
            try:       
                for x in range (10):
                    if thing['sensor']:
                        thing['sensor'].waitForNotifications(0.005) 

            except Exception as e:
                #The issue here is we stop reading from all of them!!
                print(e)    
               
                try:
                    thing['sensor'].disconnect() #May break
                except:
                    pass
                try:
                    print(f"{thing['name']} is broken - reconnecting")
                    x = threading.Thread(target=reconnect_thing,args=(thing,))
                    thing['sensor'] = None;
                    x.start()
                    
                except Exception as e:
                    print(e)
        flush_batch()


             


                    

