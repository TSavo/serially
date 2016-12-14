var serially = require("serially");

var toBeSerialized = {
    int: 1,
    float: 2.99e81,
    str: "test",
    obj: {
        int: 1,
        str: "test"
    },
    nullValue: null,
    arrayValue: [{}],
    infinityValue: Infinity,
    negInfinityValue: -Infinity,
    nanValue: NaN,
    dateValue: new Date(),
    func: function(a, b) {
        return a + b;
    }
};
toBeSerialized.circularReference = toBeSerialized;

//Serialize the whole graph to a string
var str = serially.serialize(toBeSerialized);

//Deserialize the graph
serially.unserialize(str);