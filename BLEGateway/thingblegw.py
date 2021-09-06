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


def connect_to_mongoDB():
    global collection
    try:
        with open(configfile, "r") as c:
            try:
                conn_str = c.readline().strip()
            except Exception as e:
                print(e)  # No readable config
        client = MongoClient(conn_str)
        collection = client.blescan.raw
        collection.drop()
    except Exception as e:
        print(e)
        collection = None


def flush_batch():
    global writebatch
    if len(writebatch) > 0:
        collection.insert_many(writebatch)
        writebatch = []


def write_to_mongoDB(x, y, z):
    global writebatch

    if collection == None:
        connect_to_mongoDB()

    doc = {"ts": datetime.datetime.utcnow(), "x": x, "y": y, "z": z}
    writebatch.append(doc)
    if len(writebatch) > 20:
        flush_batch()


class NotifyDelegate(DefaultDelegate):
    def __init__(self, params):
        DefaultDelegate.__init__(self)

    def handleNotification(self, cHandle, data):
        x = (int.from_bytes(data[0:2], "little") - 5000) / 1000
        y = (int.from_bytes(data[2:4], "little") - 5000) / 1000
        z = (int.from_bytes(data[4:6], "little") - 5000) / 1000
        print(f"x: {x} y: {y} z: {z}")
        write_to_mongoDB(x, y, z)


class ScanDelegate(DefaultDelegate):
    def __init__(self):
        DefaultDelegate.__init__(self)

    def handleDiscovery(self, dev, isNewDev, isNewData):
        pass


def find_cube():

    scanner = Scanner().withDelegate(ScanDelegate())
    sensor = None

    while sensor == None:
        print("Scanning")
        devices = scanner.scan(5.0)
        print("Scan Complete")

        for dev in devices:
            print(f"Device {dev.addr} {dev.addrType}, RSSI={dev.rssi} dB")
            doc = {
                "addr": dev.addr,
                "atype": dev.addrType,
                "rssi": dev.rssi,
                "ts": datetime.datetime.utcnow(),
            }
            for (adtype, desc, value) in dev.getScanData():
                print(f"{desc} : {value}")
                if DEVICENAME in value:
                    sensor = dev

    return sensor


def connect_to_cube(device):
    cube = None
    while cube == None:
        print("Tying to connect")
        try:
            cube = Peripheral(sensor)
        except Exception as e:
            print(e)
            time.sleep(1)

    try:
        services = cube.getServices()
    except Exception as e:
        print(e)
        cube = None
        return
        # Bluetooth LE breaks a lot

    cube.setDelegate(NotifyDelegate(None))
    try:
        cubeService = cube.getServiceByUUID(SERVICEUUID)  # Mon90DB
        motionCharacteristics = cubeService.getCharacteristics(forUUID=CHARUUID)  # Docs
        configHandle = motionCharacteristics[0].getHandle() + 1
        cube.writeCharacteristic(configHandle, b"\x01\x00")
        return cube
    except Exception as e:
        print("Cube is missing services?")
        print(e)
        try:
            cube.disconnect()
        except:
            pass
        cube = None
        return
        # Bluetooth LE breaks a lot
    return cube


if __name__ == "__main__":

    print("Looking for a suitable cube")
    sensor = None
    cube = None

    while True:
        if sensor == None:
            sensor = find_cube()

        if cube == None:
            cube = connect_to_cube(sensor)
        else:
            try:
                if cube.waitForNotifications(0.5) == False:
                    flush_batch()  # Nothing new
            except Exception as e:
                pprint(e)
                cube = None


