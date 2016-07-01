var mcm = require('../channel/music-channel').musicChannelManager;
var dao = require('../dao/index');
var util = require('../util');
var NetConst = require('../net').netConst;
var Log = require('../logHelper').Log;
require('../logHelper').init();
dao.init();

setTimeout(init, 1000);

function init() {
    mcm.init().then(function (value) {
        console.log('then1, value=' + value);
        throw NetConst.err(-1000, mcm);
        return mcm.insertTestChannel();
    }).then(function (value) {
        console.log('then2, value=' + value);
    }).then(function (value) {
        console.log('then3, value=' + value);
    }).then(function (value) {
        console.log('then4, value=' + value);
    }).catch(function (reason) {
        Log.e('nextMusic', reason);
        console.log('catch1, reason=' + reason.status);
    }).catch(function (reason) {
        console.log('catch2, reason=' + reason.status);
    }).catch(function (reason) {
        console.log('catch3, reason=' + reason.status);

    }).then(function (value) {
        console.log('then5, value=' + value);
    }).then(function (value) {
        console.log('then6, value=' + value);
    }).catch(function (reason) {
        console.log('catch4, reason=' + reason.status);
    }).catch(function (reason) {
        console.log('catch5, reason=' + reason.status);
    }).then(function (value) {
        console.log('last last then');
        var deferred = util.getDeferred();
        deferred.reject();
        return deferred.promise;
    }).then(function () {
        console.log('last then');
    });

    //dao.impl.findMusicByUrl('http://qwert')
    //    .then(function (value) {
    //        console.log('findMusicByUrl then, value=' + value);
    //    }).catch(function (reason) {
    //        console.log('findMusicByUrl catch, reason=' + reason.status);
    //    });
}