// I have a strong preference for system level contained functions rather than queryAnywhere - abstract and secure on the server.
exports = async function(lastSeen,windowFunc,device){
  

    if (lastSeen == null) { lastSeen = BSON.MinKey() }
    
    var collection = context.services.get("mongodb-atlas").db("blescan").collection("raw");
    rval={}

      //Look back at most 5 seconds
      var t = new Date();
      t.setSeconds(t.getSeconds() -5 );
      var limitwindow = {$match:{device:device, ts:{$gt:t}}} //Only the changed ones returned
      var match = {$match:{ts:{$gt:lastSeen}}} //Only the changed ones returned
      var cleans = { $project : { value:1,ts:1,message:1,_id:0}}
     
      if(! Array.isArray(windowFunc)) {
        windowFunc = [windowFunc]
      }

      var pipeline = [limitwindow].concat(windowFunc).concat([match,cleans]);
      
        console.log(JSON.stringify(pipeline))
        
      try 
      {
       var result = await collection.aggregate(pipeline).toArray();
       rval = { ok: true, data: result ,pipeline}
    } catch(e) {
     
        rval = { ok: false, error: JSON.stringify(e)}
    }
    return rval;
};