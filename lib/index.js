(function() {
    "use strict";
    var CIRCULARFLAG, DATEFLAG, FUNCFLAG, INFINITYFLAG, ISNATIVEFUNC, KEYPATHSEPARATOR, NANFLAG, NEGINFINITYFLAG, NULLFLAG, PROTOFLAG, PROTOTYPEFLAG, UNDEFINEDFLAG, getKeyPath, serializeCircular, serializeFunction, serializeObject, serializeWrapped, unserializeFunction, unserializeWrapped;

    FUNCFLAG = '_$$ND_FUNC$$_';

    PROTOFLAG = '_$$ND_PROTO$$_';

    PROTOTYPEFLAG = '_$$ND_PROTOTYPE$$_';

    CIRCULARFLAG = '_$$ND_CC$$_';

    DATEFLAG = '_$$ND_DATE$$_';

    INFINITYFLAG = '_$$ND_INFINITY$$_';

    NEGINFINITYFLAG = '_$$ND_NEGINFINITY$$_';

    NANFLAG = '_$$ND_NAN$$_';

    UNDEFINEDFLAG = '_$$ND_UNDEFINED$$_';

    NULLFLAG = '_$$ND_NULL$$_';

    KEYPATHSEPARATOR = '_$$.$$_';

    ISNATIVEFUNC = /^function\s*[^(]*\(.*\)\s*\{\s*\[native code\]\s*\}$/;

    if (typeof String.prototype.startsWith !== 'function') {
        String.prototype.startsWith = function(str) {
            return this.slice(0, str.length) === str;
        };
    }

    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function(str) {
            return this.slice(-str.length) === str;
        };
    }

    getKeyPath = function(obj, path) {
        var currentObj, e, error;
        path = path.split(KEYPATHSEPARATOR);
        currentObj = obj;
        try {
            path.forEach(function(p, index) {
                if (index) {
                    return currentObj = currentObj[p];
                }
            });
            return currentObj;
        } catch (error) {
            e = error;
            return false;
        }
    };

    serializeCircular = function(obj, cache) {
        var subKey;
        for (subKey in cache) {
            if (cache.hasOwnProperty(subKey) && cache[subKey] === obj) {
                return CIRCULARFLAG + subKey;
            }
        }
        return false;
    };

    serializeFunction = function(func, ignoreNativeFunc) {
        var funcStr;
        funcStr = func.toString();
        if (ISNATIVEFUNC.test(funcStr)) {
            if (ignoreNativeFunc) {
                funcStr = 'function() {throw new Error("Call a native function unserialized")}';
            } else {
                throw new Error('Can\'t serialize a object with a native function property. Use serialize(obj, true) to ignore the error.');
            }
        }
        return funcStr;
    };

    unserializeFunction = function(func, originObj) {
        var funcObj, key, vm;
        vm = require("vm");
        funcObj = vm.runInThisContext('( ' + func[FUNCFLAG] + ' )');
        delete func[FUNCFLAG];
        for (key in func) {
            funcObj[key] = func[key];
        }
        return funcObj;
    };

    serializeWrapped = function(obj) {
        if (obj instanceof Date) {
            return DATEFLAG + obj.getTime();
        }
        if (obj === void 0) {
            return UNDEFINEDFLAG;
        }
        if (obj === null) {
            return NULLFLAG;
        }
        if (obj === Infinity) {
            return INFINITYFLAG;
        }
        if (obj === -Infinity) {
            return NEGINFINITYFLAG;
        }
        if (Number.isNaN(obj)) {
            return NANFLAG;
        }
        return obj;
    };

    unserializeWrapped = function(str) {
        var dateNum;
        if (str.startsWith(DATEFLAG)) {
            dateNum = parseInt(str.slice(DATEFLAG.length), 10);
            return new Date(dateNum);
        } else if (str.startsWith(INFINITYFLAG)) {
            return Infinity;
        } else if (str.startsWith(NEGINFINITYFLAG)) {
            return -Infinity;
        } else if (str.startsWith(UNDEFINEDFLAG)) {
            return void 0;
        } else if (str.startsWith(NULLFLAG)) {
            return null;
        } else if (str.startsWith(NANFLAG)) {
            return NaN;
        } else {
            return str;
        }
    };

    serializeObject = function(obj, ignoreNativeFunc, outputObj, cache, path) {
        var keys, output;
        obj = serializeWrapped(obj);
        output = {};
        keys = Object.keys(obj);
        if (!path.endsWith('prototype') && !path.endsWith('__proto__')) {
            keys.push('prototype');
            keys.push('__proto__');
        }
        keys.forEach(function(key) {
            var destKey, found;
            if (obj.hasOwnProperty(key) || key === 'prototype' || key === '__proto__') {
                destKey = key === '__proto__' ? PROTOFLAG : key === 'prototype' ? PROTOTYPEFLAG : key;
                if ((typeof obj[key] === 'object' || typeof obj[key] === 'function') && obj[key] !== null) {
                    found = serializeCircular(obj[key], cache);
                    if (found) {
                        return output[destKey] = found;
                    } else {
                        return output[destKey] = module.exports.serialize(obj[key], ignoreNativeFunc, outputObj[key], cache, path + KEYPATHSEPARATOR + key);
                    }
                } else {
                    return output[destKey] = serializeWrapped(obj[key]);
                }
            }
        });
        return output;
    };

    module.exports.serialize = function(obj, ignoreNativeFunc, outputObj, cache, path) {
        var found;
        if (ignoreNativeFunc == null) {
            ignoreNativeFunc = false;
        }
        if (outputObj == null) {
            outputObj = {};
        }
        if (cache == null) {
            cache = {};
        }
        if (path == null) {
            path = "$";
        }
        obj = serializeWrapped(obj);
        if (typeof obj === 'string' || typeof obj === 'number') {
            outputObj = obj;
        } else if (obj.constructor === Array) {
            outputObj = [];
            cache[path] = outputObj;
            obj.forEach(function(value, index) {
                return outputObj.push(module.exports.serialize(value, ignoreNativeFunc, outputObj, cache, path + KEYPATHSEPARATOR + index));
            });
        } else {
            found = serializeCircular(obj, cache);
            if (found) {
                outputObj = found;
            } else {
                cache[path] = obj;
                outputObj = serializeObject(obj, ignoreNativeFunc, outputObj, cache, path);
                if (typeof obj === 'function') {
                    outputObj[FUNCFLAG] = serializeFunction(obj, ignoreNativeFunc);
                }
            }
        }
        if (path === '$') {
            return JSON.stringify(outputObj);
        } else {
            return outputObj;
        }
    };

    module.exports.deserialize = function(obj, originObj) {
        var circularTasks, destKey, key;
        circularTasks = [];
        if (typeof obj === 'string') {
            obj = JSON.parse(obj);
        }
        originObj = originObj || obj;
        if (obj && obj[FUNCFLAG]) {
            obj = unserializeFunction(obj);
        }
        if (typeof obj === 'string') {
            obj = unserializeWrapped(obj);
        }
        for (key in obj) {
            if (!obj.hasOwnProperty(key)) {
                return;
            }
            destKey = key === PROTOFLAG ? '__proto__' : key === PROTOTYPEFLAG ? 'prototype' : key;
            if (destKey === 'prototype' && obj[key] === UNDEFINEDFLAG) {
                delete obj[key];
                continue;
            }
            if (typeof obj[key] === 'object' || typeof obj[key] === 'function') {
                obj[destKey] = module.exports.deserialize(obj[key], originObj);
            } else if (typeof obj[key] === 'string') {
                if (obj[key].indexOf(CIRCULARFLAG) === 0) {
                    obj[key] = obj[key].substring(CIRCULARFLAG.length);
                    circularTasks.push({
                        obj: obj,
                        sourceKey: key,
                        destKey: destKey
                    });
                } else {
                    obj[destKey] = unserializeWrapped(obj[key]);
                }
            }
        }
        circularTasks.forEach(function(task) {
            var found;
            if (found = getKeyPath(originObj, task.obj[task.sourceKey])) {
                return task.obj[task.destKey] = found;
            }
        });
        if (obj) {
            delete obj[PROTOTYPEFLAG];
            delete obj[PROTOFLAG];
        }
        return obj;
    };

}).call(this);
