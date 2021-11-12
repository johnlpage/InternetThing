exports = function(doc){
  
    var collection = context.services.get("mongodb-atlas").db("blescan").collection("raw");
    
    collection.insertOne(doc);
  return true;
};