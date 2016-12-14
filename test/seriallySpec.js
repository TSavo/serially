var chai, expect, serialize;

chai = require("chai");

expect = chai.expect;

chai.should();

serialize = require("../lib");

describe("Serialization", function() {
    it("should serialize a basic graph", function() {
        var base, deserialized;
        base = {
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
        base.dupe1 = {};
        base.dupe2 = base.dupe1;
        base.dupe1.dupe2 = base.dupe2;
        base.dupe3 = {
            dupe2: base.dupe2
        };
        base.dupe3.more = {
            base: base,
            dupe2: base.dupe2
        };
        base.self = base;
        deserialized = serialize.deserialize(serialize.serialize(base, true));
        base.int.should.equal(deserialized.int);
        base.str.should.equal(deserialized.str);
        base.float.should.equal(deserialized.float);
        base.obj.int.should.equal(deserialized.obj.int);
        base.obj.str.should.equal(deserialized.obj.str);
        expect(base.nullValue).to.equal(deserialized.nullValue);
        base.infinityValue.should.equal(deserialized.infinityValue);
        base.negInfinityValue.should.equal(deserialized.negInfinityValue);
        expect(deserialized.nanValue).to.be.NaN;
        base.func.toString().should.equal(deserialized.func.toString());
        deserialized.self.self.self.self.self.should.equal(deserialized);
        return deserialized.func(2, 2).should.equal(4);
    });
    it("should throw an error when encountering a native function", function() {
        return expect(function() {
            return serialize.serialize({
                console: console
            });
        }).to["throw"]();
    });
    it("should not trown an error when it's allowed to serialize native functions", function() {
        return expect(function() {
            return serialize.serialize({
                console: console
            }, true);
        }).not.to["throw"]();
    });
    it("should serialize a complex graph", function() {
        var a, deserialized, x, y, z;
        x = {};
        y = {};
        z = {};
        a = {};
        x.y = y;
        y.z = z;
        z.a = a;
        a.x = x;
        x.n = {};
        x.n.n = {};
        x.n.n.n = {};
        x.n.n.n.n = y;
        z.y = y;
        x.func = x.func2 = x.func3 = function() {};
        deserialized = serialize.deserialize(serialize.serialize(x));
        deserialized.y.z.a.x.should.equal(deserialized);
        deserialized.n.n.n.n.should.equal(deserialized.y);
        deserialized.y.z.y.should.equal(deserialized.y);
        deserialized.func.should.equal(deserialized.func2);
        return deserialized.func.should.equal(deserialized.func3);
    });
    return it("should serialize a function which knows about 'this'", function() {
        var x;
        x = {
            value: "hello",
            func: function() {
                return this.value;
            }
        };
        return serialize.deserialize(serialize.serialize(x)).func().should.equal(x.value);
    });
});
