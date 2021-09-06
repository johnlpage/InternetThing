// I have a strong preference for system level contained functions rather than queryAnywhere - abstract and secure on the server.
exports = async function(lastSeen){
    if (lastSeen == null) { lastSeen = BSON.MinKey() }
    
    var collection = context.services.get("mongodb-atlas").db("blescan").collection("raw");
    rval={}
    try {
      //Fimd the last N in reverse order limiting by total and also no further back than lasSeen
      var result = await collection.find({ts:{$gt:lastSeen}}).sort({ts:-1}).limit(300).toArray();
      
      rval = { ok: true, data: result }
    } catch(e) {
      rval = { ok: false, error: e }
    }
    return rval;
};