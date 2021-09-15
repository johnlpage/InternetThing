{
    "$setWindowFields": {
      "sortBy": {
        "ts": 1
      },
      "output": {
        "value": {
          "$expMovingAvg":{input: "$az",N:20},
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


  {
    "$setWindowFields": {
      "sortBy": {
        "ts": 1
      },
      "output": {
        "value": {
          "$integrap": {input: "$az"},
          "window": {
            "documents": [
              "current",
              "current"
            ]
          }
        }
      }
    }
  }


 a= { '$setWindowFields' : {'sortBy' : { 'ts': 1 } , 'output': { 'value': { '$integral': {input: "$gz", "unit" : "second" },
 'window': { 'documents': [-50, "current"] } } } } }
