var proxyaddr = require('proxy-addr');

var util = {};

util.defineMember = function(obj, name) {
    var nameSplit = name.split('.');
    var i;
    var exists = obj;

    for (i = 0; i < nameSplit.length - 1; i++) {
        if (!exists.hasOwnProperty(nameSplit[i]) || typeof exists[nameSplit[i]] !== 'object') {
            exists[nameSplit[i]] = {};
        }
        exists = exists[nameSplit[i]]
    }
};

util.compileTrust = function(val) {
    if (typeof val === 'function') return val;

    if (val === true) {

        return function() { return true };
    }

    if (typeof val === 'number') {

        return function(a, i) { return i < val };
    }

    if (typeof val === 'string') {

        val = val.split(/ *, */);
    }

    return proxyaddr.compile(val || []);
};

module.exports = util;