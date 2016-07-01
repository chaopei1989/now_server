/**
 * Created by chaopei on 2015/9/8.
 */

var Promise = require('lie');

var NetConst = require('./net').netConst;

var util = {

    template: require('./lib/template'),

    getDeferred: function () {
        var d = {};
        d.promise = new Promise(function(res, rej) {
            d.resolve = res;
            d.reject = rej;
        });
        return d;
    },

    GlobalLock: function() {
        this._locked = false;
    },

    /**
     * 随机数 [0, range)
     * @param range
     * @returns {number}
     */
    randomInt : function (range) {
        return Math.floor(Math.random() * range)
    }

};


util.GlobalLock.prototype.lock = function() {
    this._locked = true;
};

util.GlobalLock.prototype.unlock = function() {
    this._locked = false;
};

util.GlobalLock.prototype.isLock = function() {
    return this._locked;
};


module.exports = util;
