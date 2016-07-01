/**
 * Created by chaopei on 2015/9/7.
 */

var Const = require('./const');

var music = require('./music-channel');

var mcm = music.musicChannelManager;

var gmNet = require('../net');

var dao = require('../dao/index');

var template = require('../util').template;

var Log = require('../logHelper').Log;

var sockets = {};

var Error = require('../net').Error;

var NetConst = require('../net').netConst;

var userTotalCount = 0;

var start_listen = function (io) {

    var nsp = io.of(Const.NAMESPACE);

    mcm.nsp = nsp;
    mcm.init().then(function () {
        nsp.on(Const.EVENT_CONNECTION, function (socket) {
            socket.channelId = Const.INVALID_CID;
            console.log('somebody connected');
            //todo login
            socket.on(Const.EVENT_JOIN_CS, function (str) {
                if (socket.channelId) {
                    //todo 已经join过了
                    console.log('已经join过了, cid=' + socket.channelId);
                }
                var json = JSON.parse(str);
                if (null == json) {
                    console.log('Illegal json format:' + str);
                    socket.emit(Const.EVENT_JOIN_SC, gmNet.Response.createError(gmNet.netConst.STATUS_ILLEGAL_ARGS));
                    return;
                }
                var cid = json.cid;
                if (isNaN(cid)) {
                    console.log('Illegal cid parsed');
                    socket.emit(Const.EVENT_JOIN_SC, gmNet.Response.createError(gmNet.netConst.STATUS_ILLEGAL_ARGS, 'cid is not an Integer.'));
                    return;
                }
                dao.impl.findUserByUserIdOpenId(json.userId, json.openId)
                    .then(function (rows) {
                        if (0 === rows.length) {
                            console.log('no this user, ' + json);
                            throw NetConst.err(gmNet.netConst.STATUS_ILLEGAL_ARGS, 'no this user');
                        } else {
                            var ch = mcm.channels[cid];
                            if (!ch) {
                                console.log('channel not exist, cid=' + cid);
                                throw NetConst.err(gmNet.netConst.STATUS_ILLEGAL_ARGS, 'channel not exist, cid=' + cid);
                            } else {
                                socket.join(cid.toString());
                                socket.channelId = cid;
                                socket.userId = json.userId;
                                socket.openId = json.openId;
                                console.log(new template('somebody join in, channelId={{cid}}, userId={{uid}}').render({
                                    cid: socket.channelId,
                                    uid: socket.userId
                                }));

                                //心跳监听
                                socket.on(Const.EVENT_HEART_CS, function (data) {
                                    if(-1 === ch.users.indexOf(socket.userId)) {
                                        ch.users.push(socket.userId);
                                    }
                                    if(null == sockets[socket.userId]) {
                                        userTotalCount++;
                                    }
                                    sockets[socket.userId] = socket;
                                });

                                return {channel:ch.channel, curr:ch.curr, state:ch.state};
                            }
                        }
                    })
                    .then(function (channel) {
                        socket.emit(Const.EVENT_JOIN_SC, gmNet.Response.createOK(channel));
                    })
                    .catch(function (err) {
                        Log.e('join', err);
                        if(err.constructor != Error) {
                            throw err;
                        }
                        socket.emit(Const.EVENT_JOIN_SC, gmNet.Response.createError(err.status, err.msg));
                    });
            });

            socket.on(Const.EVENT_DISCONNECT, function (data) {
                console.log(new template('somebody disconnected, channelId={{cid}}, userId={{uid}}').render({
                    cid: socket.channelId,
                    uid: socket.userId
                }));
                var ch = mcm.channels[socket.channelId];
                if (ch) {
                    var userIndex;
                    while(-1 < (userIndex = ch.users.indexOf(socket.userId))) {
                        ch.users.splice(userIndex, 1);
                    }
                }
                if(null != sockets[socket.userId] && 0 < userTotalCount) {
                    --userTotalCount;
                }
                delete sockets[socket.userId];
            });
        });

        function heart() {
            for(var key in mcm.channels) {
                var ch = mcm.channels[key];
                var musicCount;
                if(Const.MUSIC_STATE.OVER == ch.state) {
                    musicCount = 0;
                } else {
                    musicCount = ch.musics.length - ch.channel.playingIndex;
                }
                nsp.to(key).emit(Const.EVENT_HEART_SC, gmNet.Response.createOK({state:ch.state, music:ch.curr, userCount:ch.users.length, musicCount:musicCount}));
            }
            setTimeout(heart, 10000);
        }

        setTimeout(heart, 10000);
    });
};

module.exports.sockets = sockets;
module.exports.start_listen = start_listen;