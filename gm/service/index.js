/**
 * Created by chaopei on 2015/9/15.
 */
var dao = require('../dao/index');
var Response = require('../net').Response;
var NetConst = require('../net').netConst;
var Error = require('../net').Error;
var User = require('../model/user').User;
var Log = require('../logHelper').Log;
var Music = require('../model/music').Music;
var sockets = require('../channel/channel').sockets;
var mcm = require('../channel/music-channel').musicChannelManager;
var util = require('../util');
var Const = require('../channel/const');
var lock = require('../channel/music-channel').lock;
var service = {
    /**
     * 用户登录
     * @param req
     * @param res
     */
    userLogin: function (req, res) {
        var data = JSON.parse(req.body.data);
        var openId = data.openId;
        dao.impl.findUserByOpenId(openId)
            .then(function (rows) {
                if (0 === rows.length) {
                    //没找到，则注册
                    var user = new User();
                    user.userName = data.userName;
                    user.type = data.type;
                    user.gender = data.gender;
                    user.iconUrl = data.iconUrl;
                    user.openId = data.openId;
                    user.token = data.token;
                    user.expiresTime = data.expiresTime;
                    return dao.impl.addUser(user)
                        .then(function (r) {
                            //插入成功
                            Log.i('userLogin', 'newUser userId=' + r.insertId);
                            res.send(Response.createOK({userId: r.insertId}));
                        });
                } else {
                    //找到了
                    return dao.impl.updateUserNameIconUrlGenderById(rows[0].userId, data.userName, data.iconUrl, data.gender)
                        .then(function (result) {
                            console.log('已有用户 userId=' + rows[0].userId);
                            res.send(Response.createOK({userId: rows[0].userId}));
                        });
                }
            })
            .catch(function (err) {
                Log.e('userLogin', err);
                if (err.constructor != Error) {
                    throw err;//让其500错误
                }
                res.send(Response.createError(err.status, err.msg));
            });
    },

    /**
     * 点歌
     * @param req
     * @param res
     */
    channelRequest: function (req, res) {
        var data = JSON.parse(req.body.data);
        var userId = data.userId;
        var openId = data.openId;
        var music = new Music();

        music.title = data.title; // 歌曲名
        music.cover = data.cover;

        var url = data.url;
        if(0 < url.indexOf('?')) {
            url = url.slice(0, url.indexOf('?'));
        }
        music.url = url;

        music.album = data.album;
        music.artist = data.artist;
        music.duration = data.duration;

        var socket = sockets[userId];
        if (null == socket || null == socket.channelId) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_USER, 'socket=' + socket));
            return;
        }
        var channel = mcm.channels[socket.channelId];
        if (null == channel) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_CHANNEL));
            return;
        }
        dao.impl.findUserByUserIdOpenId(userId, openId) //查询点歌人是否存在
            .then(function (rows) {
                if (0 === rows.length) {
                    throw NetConst.err(NetConst.ERR_NO_SUCH_USER);
                } else {
                    return dao.impl.findMusicByUrl(music.url); // 若点歌人存在，则查询歌曲是否存在
                }
            })
            .then(function (rows) {
                var deferred = util.getDeferred();
                if (0 === rows.length) { // 点的歌不存在，插入歌曲
                    dao.impl.addMusic(music.title, music.url, music.cover, music.album, music.artist, music.duration)
                        .then(function (res) {
                            music.musicId = res.insertId;
                            deferred.resolve();
                        })
                        .catch(function (err) {
                            deferred.reject(err);
                        });
                } else {
                    music.musicId = rows[0].musicId;
                    deferred.resolve();
                }
                return deferred.promise
                    .then(function (res) {
                        return channel.addMusic(music.musicId, userId); //歌曲和点歌人都合法，则插入歌曲
                    });
            })
            .then(function () {
                return dao.impl.addUserMusic(userId, music.musicId)
                    .catch(function (err) {
                        if (23000 != parseInt(err.msg.sqlState)) { //重复插入无碍
                            throw err;
                        }
                    });
            })
            .then(function () {
                res.send(Response.createOK());
            })
            .catch(function (err) {
                Log.e('channelRequest', err);
                if (err.constructor != Error) {
                    throw err;//让其500错误
                }
                res.send(Response.createError(err.status, err.msg));
            });
    },

    /**
     * 点赞/踩
     * @param req
     * @param res
     */
    channelCommend: function (req, res) {
        var data = JSON.parse(req.body.data);
        var userId = data.userId;
        var openId = data.openId;
        var musicId = data.musicId;
        var type = data.type;
        if (lock.isLock()) {
            res.send(Response.createError(NetConst.ERR_NOT_READY_YET, '切歌阶段禁止点赞'));
            return;
        }
        if (isNaN(type) || isNaN(musicId)) {
            res.send(Response.createError(NetConst.STATUS_ILLEGAL_ARGS));
            return;
        }
        var socket = sockets[userId];
        if (null == socket) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_USER, 'socket=' + socket));
            return;
        }
        if (null == socket.channelId) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_USER, 'socket.channelId=' + socket.channelId));
            return;
        }
        var channel = mcm.channels[socket.channelId];
        if (null == channel) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_CHANNEL));
            return;
        }
        var playingIndex = channel.channel.playingIndex;
        var channel_music = channel.musics[playingIndex];
        if (null == channel_music) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_CHANNEL));
            return;
        }
        var user;
        dao.impl.findUserByUserIdOpenId(userId, openId) //查询点歌人是否存在
            .then(function (rows) {
                if (0 === rows.length) {
                    throw NetConst.err(NetConst.ERR_NO_SUCH_USER, 'userId or openId is error.');
                } else {
                    user = rows[0];
                    var curr = channel.curr;
                    if (null != curr && musicId === curr.musicId && musicId === channel_music.musicId) {
                        return dao.impl.addChannelCommend(userId, channel_music.id, type); //添加到点赞表
                    } else {
                        throw NetConst.err(NetConst.STATUS_ILLEGAL_ARGS, 'musicId err');
                    }
                }
            })
            .then(function (result) { //内存更新并通知个客户端
                var curr = channel.curr;
                if (0 < type) {
                    if (1024 != (user.privilege&1024)) {//无5分特权
                        type = 1;
                    }
                    channel_music.like += type;
                    curr.like = channel_music.like;
                } else if (0 > type) {
                    if (1024 != (user.privilege&1024)) {//无5分特权
                        type = -1;
                    }
                    channel_music.dislike += (-type);
                    curr.dislike = channel_music.dislike;
                }
                mcm.nsp.to(channel.channel.channelId).emit(Const.EVENT_LIKE_DISLIKE_SC, Response.createOK({music:curr, user:user, type:type}));
                if (5 <= (curr.dislike - curr.like)) {
                    if (0 === channel_music.passed && channel.channel.playingIndex === playingIndex) {
                        channel_music.passed = 1;
                        channel.nextMusicTimeOut(0);
                    }
                }
            })
            .then(function (result) {
                res.send(Response.createOK());
            })
            .catch(function (err) {
                if (err.constructor === Error && 23000 === parseInt(err.msg.sqlState)) { //重复插入
                    res.send(Response.createError(NetConst.ERR_DUPLICATED, '重复点赞'));
                } else {
                    Log.e('channelCommend', err);
                    if (err.constructor != Error) {
                        throw err;//让其500错误
                    }
                    res.send(Response.createError(err.status, err.msg));
                }
            })
            .then(function () {
                return dao.impl.addUserLikeMusic(userId, musicId, type);
            })
            .catch(function (err) {
            });
    },
    channelUsersAll: function (req, res) {
        var channelId = req.params.channelId;
        if (!channelId) {
            res.send(Response.createError(NetConst.STATUS_ILLEGAL_ARGS));
            return;
        }
        var ch = mcm.channels[channelId];
        if (!ch) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_CHANNEL));
            return;
        }
        dao.impl.findUserByIds(ch.users)
            .then(function (rows) {
                res.send(Response.createOK(rows));
            })
            .catch(function (err) {
                Log.e('channelUsersAll', err);
                if (err.constructor != Error) {
                    throw err;//让其500错误
                }
                res.send(Response.createError(err.status, err.msg));
            });
    },
    channelUsersCurr: function (req, res) {
        var channelId = req.params.channelId;
        if (null == channelId) {
            res.send(Response.createError(NetConst.STATUS_ILLEGAL_ARGS));
            return;
        }
        var ch = mcm.channels[channelId];
        if (null == ch) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_CHANNEL));
            return;
        }
        res.send(Response.createOK(ch.currUser));
    },
    channelMusics: function (req, res) {
        var channelId = req.params.channelId;
        if (null == channelId) {
            res.send(Response.createError(NetConst.STATUS_ILLEGAL_ARGS));
            return;
        }
        var ch = mcm.channels[channelId];
        if (null == ch) {
            res.send(Response.createError(NetConst.ERR_NO_SUCH_CHANNEL));
            return;
        }
        dao.impl.findChannelMusicAfterId(ch.musics[ch.channel.playingIndex].id)
            .then(function (rows) {
                res.send(Response.createOK(rows));
            })
            .catch(function (err) {
                Log.e('channelMusics', err);
                if (err.constructor != Error) {
                    throw err;//让其500错误
                }
                res.send(Response.createError(err.status, err.msg));
            });
    },
    _api_channels: [
        /*单曲循环 */995,
        /*FeelingTunes */1168407,
        /*听点民谣和摇滚 */1001396,
        /*我唱得不够好你不要皱眉 */1000024,
        /*我们就爱听不懂词的英文歌 */1002041,
        /*爱死港乐_粤语歌 */1000734,
        /*民谣诗人  */1029068,
        /*好听的英文歌 */1000997,
        /*摇滚是青春唯一的救赎 */1062947,
        /*老歌最动听 */1006669,
        /*喜欢这首歌的原因  */1070095,
        /*电影原声OST */1002561,
        /*电音&EDM */1008825,
        /*运动的耳间奏 */1193031,
        /*动漫音乐 */1003971],
    api: function (req, res) {
        var openId = req.param('openId');
        var userId = req.param('userId');
        dao.impl.findUserByUserIdOpenId(userId, openId) //查询点歌人是否存在
            .then(function (rows) {
                if (0 === rows.length) {
                    throw NetConst.err(NetConst.ERR_NO_SUCH_USER, 'userId or openId is error.');
                } else {
                    res.send(Response.createOK('http://mobile.ohsame.com/music/channel/' + service._api_channels[util.randomInt(service._api_channels.length)] + '/search?query=%s&limit=%d&offset=%d'));
                }
            })
            .catch(function (err) {
                Log.e('api', err);
                if (err.constructor != Error) {
                    throw err;//让其500错误
                }
                res.send(Response.createError(err.status, err.msg));
            });
    },

    userIcon: function (req, res) {
        var ids = [];
        for (var key in sockets) {
            ids.push(key);
            if(8 == ids.length) {
                break;
            }
        }
        dao.impl.findUserByIds(ids)
            .then(function (rows) {
                res.send(Response.createOK(rows));
            })
            .catch(function (err) {
                Log.e('api', err);
                if (err.constructor != Error) {
                    throw err;//让其500错误
                }
                res.send(Response.createError(err.status, err.msg));
            });
    }
};

module.exports = service;