# The Serially Function Serialization Javascript Library

## What it does

Serializes circular references and other unserializable types like Dates, .prototype and functions to JSON.

## What is supported

| Type | JSON.stringify  | Serially.serialize |
|:---:|:---:|:---:|
| Strings | Yes | Yes |
| Numbers | Yes | Yes |
| Dates   | As a string | Yes |
| NaN / Infinity / Undefined | No | Yes |
| Circular references | No | Yes |
| Functions | No | Yes |
| Native functions | No | Yes* |

* *Native functions can be optionally ignored, but should be avoided in serialized graphs as a best practice.

# Installation

    npm install --save serially

# Example Usage

#### As a module:
```javascript
var should = require("chai");
var expect = chai.expect;
chai.should();

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
var deserialized = serially.unserialize(str);

toBeSerialized.int.should.equal(deserialized.int);
toBeSerialized.str.should.equal(deserialized.str);
toBeSerialized.float.should.equal(deserialized.float);
toBeSerialized.obj.int.should.equal(deserialized.obj.int);
toBeSerialized.obj.str.should.equal(deserialized.obj.str);
expect(toBeSerialized.nullValue).to.equal(deserialized.nullValue);
toBeSerialized.infinityValue.should.equal(deserialized.infinityValue);
toBeSerialized.negInfinityValue.should.equal(deserialized.negInfinityValue);
expect(deserialized.nanValue).to.be.NaN;
toBeSerialized.func.toString().should.equal(deserialized.func.toString());
deserialized.func(2, 2).should.equal(4);
deserialized.circularReference.circularReference.circularReference.circularReference.should.equal(deserialized);

```

# Contributing
Pull requests are welcome, please file any bugs on https://github.com/tsavo/serially-js