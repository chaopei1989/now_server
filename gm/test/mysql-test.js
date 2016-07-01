/**
 * Created by chaopei on 2015/10/1.
 */
var dao = require('../dao/index');

var NetConst = require('../net').netConst;

var Const = require('../channel/const');

var Log = require('../logHelper').Log;

var mcm = require('../channel/music-channel').musicChannelManager;

require('../logHelper').init(null, '../conf/log4js_conf.json');

dao.init("../conf/mysql.json")
    .then(function (res) {
        return dao.impl.findUserByOpenId( 'EBDFA2270ACD9E5D9E11');
    })
    .then(function (rows) {
        console.log(rows);
        return dao.impl.findChannels();
    })
    .then(function (rows) {
        rows.forEach(function (row) {
            console.log(row);
        });
        console.log(typeof rows);
        return dao.impl.findMusicByChannelId(1024);
    })
    .then(function (rows) {
        console.log(typeof rows);
        return dao.impl.addUserLikeMusic(1024, 23, 5);
    })
    .then(function (rows) {
        console.log(rows);
    })
    .catch(function (err) {
        console.log("err:"+typeof err);
        console.log(err.msg);
    });