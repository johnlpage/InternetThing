// I have a strong preference for system level contained functions rather than queryAnywhere - abstract and secure on the server.
exports = async function(lastSeen,device){
    if (lastSeen == null) { lastSeen = BSON.MinKey() }
    
    var collection = context.services.get("mongodb-atlas").db("blescan").collection("raw");
    rval={}
    try {
      //Fimd the last N in reverse order limiting by total and also no further back than lasSeen
      
      //Workaround for indexing isue in early TS
var pipe=[
  { '$match': { ts: { '$gt': lastSeen} } },
  { '$set' : { device: {$concat:["_","$device"]} }},
  { '$match': { device: `_${device}` } },
  { '$sort': { ts: -1 } },
  { '$limit': 300 },
  {$set : { az: { $subtract : ["$az",1.0]}}}
]

      var result = await collection.aggregate(pipe).toArray();
      
      rval = { ok: true, data: result }
      console.log(result.length)
    } catch(e) {
      rval = { ok: false, error: e }
    }
    return rval;
};