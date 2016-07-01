/**
 * Created by chaopei on 2015/9/8.
 */

var Const = require('./const');

var Response = require('../net').Response;

var NetConst = require('../net').netConst;

var util = require('../util');

var TEST = require('../env').TEST;

var Channel = require('../model/channel').Channel;

var dao = require('../dao/index');

var Log = require('../logHelper').Log;

var GlobalLock = require('../util').GlobalLock;

var lock = new GlobalLock();

exports.lock = lock;

/**
 * 音乐频道wrapper类
 * @constructor
 */
function MusicChannel() {
    this.channel = new Channel();
    this.musics = [];
    this.curr = null;
    this.currUser = null;
    /**
     * 用户id列表
     * @type {Number, socket}
     */
    this.users = [];
    this.playTimeout = null;
    this.state = Const.MUSIC_STATE.OVER;
}

/**
 * 音乐频道类 - 添加音乐，并更新音乐点歌次数
 */
MusicChannel.prototype.addMusic = function (musicId, userId) {
    var self = this;
    var channelMusic;
    //往频道中插入歌曲
    return dao.impl.insertChannelMusic(self.channel.channelId, musicId, userId)
        .then(function (result) {
            return dao.impl.findChannelMusicById(result.insertId);
        })
        .then(function (rows) {
            if (0 === rows.length) {
                throw NetConst.err(NetConst.ERR_NO_SUCH_MUSIC, "findChannelMusicById null");
            } else {
                channelMusic = rows[0];
                return dao.impl.findMusicById(musicId);
            }
        })
        .then(function (rows) {
            if (0 === rows.length) {
                throw NetConst.err(NetConst.ERR_NO_SUCH_MUSIC);
            } else {
                return dao.impl.updateMusicRequest(musicId, rows[0].request + 1);
            }
        })
        .then(function (res) {
            self.musics.push(channelMusic);
            if (self.state === Const.MUSIC_STATE.OVER) {　//如果当前播放状态是结束了，则立即切歌
                self.state = Const.MUSIC_STATE.PREPARED;
                self.nextMusicTimeOut(0);
            }
        });
};

/**
 * 音乐频道类 - 改变频道名
 * @param name
 */
MusicChannel.prototype.changeName = function (name) {
    this.channel.channelName = name;
};

MusicChannel.prototype.saveLastMusicLikeDislikeStatus = function () {
    var deferred = util.getDeferred();
    if(this.channel.playingIndex >= 0 && this.channel.playingIndex < this.musics.length){
        var lastChannelMusic = this.musics[this.channel.playingIndex];
        if (null != lastChannelMusic) {
            dao.impl.updateMusicAddLikeById(lastChannelMusic.musicId, lastChannelMusic.like, lastChannelMusic.dislike)
                .then(function (res) {
                    if (null != lastChannelMusic) {
                        return dao.impl.updateChannelMusicById(lastChannelMusic.id, lastChannelMusic.like, lastChannelMusic.dislike, lastChannelMusic.passed);
                    }
                })
                .then(function (res) {
                    if (null != lastChannelMusic) {
                        return dao.impl.updateUserMusicLike(lastChannelMusic.userId, lastChannelMusic.musicId, lastChannelMusic.like, lastChannelMusic.dislike);
                    }
                })
                .then(function (res) {
                    deferred.resolve();
                })
                .catch(function (err) {
                    Log.e('saveLastMusicLikeDislikeStatus', err);
                    deferred.reject(err);
                });
        } else {
            deferred.resolve();
        }
    }
    return deferred.promise;
};

/**
 * 音乐频道类 - 切歌
 */
MusicChannel.prototype.nextMusic = function () {
    var self = this;
    var len = self.musics.length;
    self.saveLastMusicLikeDislikeStatus();

    //if(0 < len && self.channel.playingIndex === (len - 1)){
    //    self.channel.playingIndex = -1; // 为了循环
    //}
    self.curr = null; // 当前歌曲消失
    self.currUser = null;
    if (0 < len && self.channel.playingIndex < (len - 1)) { // 还有下一首
        lock.lock();
        self.state = Const.MUSIC_STATE.PREPARED;
        var index = self.channel.playingIndex + 1;
        // 切歌
        var nextMusicId = self.musics[index].musicId;
        var nextUserId = self.musics[index].userId;
        var nextUser;
        dao.impl.findUserById(nextUserId)
            .then(function (rows) {
                if (0 === rows.length) {
                    throw NetConst.err(NetConst.ERR_NO_SUCH_USER);
                } else {
                    nextUser = rows[0];
                }
            })
            .then(function (res) {
                return dao.impl.findMusicById(nextMusicId);
            })
            .then(function (rows) {
                if (0 === rows.length) {
                    self.nextMusicTimeOut(0);
                } else {
                    self.channel.playingIndex = index;
                    self.curr = rows[0];
                    self.curr.like = self.curr.dislike = 0;
                    self.currUser = nextUser;
                    Log.i('nextMusic',
                        new util.template('[nextMusic] : len={{len}}, nextIndex={{pi}}, nextMusic={{str}}')
                            .render({len: len, pi: self.channel.playingIndex, str: self.curr.title})
                    );
                    musicChannelManager.nsp.to(self.channel.channelId).emit(Const.EVENT_MUSIC_NEXT_SC, Response.createOK(self.curr));

                    self.playMusicTimeOut(Const.MUSIC_WAIT);
                }
            })
            .catch(function (err) {
                Log.e('nextMusic', err);
                self.nextMusicTimeOut(0);
            })

    } else {
        // 已经到了歌单最后了
        Log.i('nextMusic',
            new util.template('[nextMusic] over: len={{len}}, playingIndex={{pi}}')
                .render({len: len, pi: self.channel.playingIndex})
        );
        self.channel.playingIndex = len - 1;
        self.state = Const.MUSIC_STATE.OVER;
    }
};

/**
 * 音乐频道类 - 从头播放当前歌曲
 */
MusicChannel.prototype.playMusic = function () {
    var self = this;
    var len = self.musics.length;
    if (0 < len && 0 <= this.channel.playingIndex && this.channel.playingIndex < len) {
        // 更新playingIndex
        dao.impl.updatePlayingIndexByChannelId(self.channel.channelId, self.channel.playingIndex)
            .then(function (res) {// 播放
                Log.i('playMusic',
                    new util.template('[playMusic] : len={{len}}, playingIndex={{pi}}, music={{str}}')
                        .render({len: len, pi: self.channel.playingIndex, str: self.curr.title})
                );
                musicChannelManager.nsp.to(self.channel.channelId).emit(Const.EVENT_PLAY_SC, Response.createOK(self.curr));
                self.nextMusicTimeOut(self.curr.duration + Const.MUSIC_WAIT);
                self.state = Const.MUSIC_STATE.PLAYING;
            })
            .then(function () {
                lock.unlock();
            })
            .catch(function (err) {
                Log.e('playMusic', err);
                self.nextMusicTimeOut(0);
            });

    } else {
        // index不合法
        Log.e('playMusic',
            new util.template('[playMusic] over: len={{len}}, playingIndex={{pi}}')
                .render({len: len, pi: this.channel.playingIndex})
        );
        self.channel.playingIndex = len - 1;
        self.state = Const.MUSIC_STATE.OVER;
    }
};

MusicChannel.prototype.nextMusicTimeOut = function (wait) {
    if (null != this.playTimeout) { // 如果playTimeout不为null且不为undefined
        clearTimeout(this.playTimeout);
    }
    this.playTimeout = setTimeout(this.nextMusic.bind(this), wait);
};

MusicChannel.prototype.playMusicTimeOut = function (wait) {
    if (null != this.playTimeout) { // 如果playTimeout不为null且不为undefined
        clearTimeout(this.playTimeout);
    }
    this.playTimeout = setTimeout(this.playMusic.bind(this), wait);
};

/**
 * 全局音乐频道管理对象
 * @constructor
 */
var musicChannelManager = {
    nsp: null,
    channels: {},
    insertTestChannel: function () {
        return dao.impl.findChannelByChannelId(Const.TEST_CID)
            .then(function (document) {
                if (!document) {
                    var channel = new Channel();
                    channel.channelId = Const.TEST_CID;
                    channel.channelName = Const.TEST_CNAME;
                    return dao.impl.addChannel(channel);
                } else {
                    throw NetConst.err(NetConst.ERR_CHANNEL_EXIST, 'TEST CHANNEL exist.');
                }
            })
    },
    /**
     * 初始化所有channel
     */
    init: function () {
        var self = this;
        return dao.impl.findChannels()
            .then(function (channels) {
                var deferred = util.getDeferred();
                if (!channels) {
                    console.log('[findChannels] : !channels=' + channels);
                } else {
                    var len = channels.length;
                    if (0 === len) {
                        deferred.resolve();
                    } else {
                        channels.forEach(function (channel) {
                            console.log('[findChannels] : channelName=' + channel.channelName);
                            var mc = new MusicChannel();
                            mc.channel = channel;
                            mc.state = Const.MUSIC_STATE.PREPARED;
                            dao.impl.findMusicByChannelId(channel.channelId)
                                .then(function (rows) {
                                    rows.forEach(function (row) {
                                        row.passed = 0;
                                        mc.musics.push(row);
                                    });
                                    self.channels[channel.channelId] = mc;
                                    len -= 1;
                                    if (0 === len) {
                                        deferred.resolve();
                                    }
                                });
                        });
                        console.log('[findChannels] : ');
                        console.log(channels);
                    }
                }
                return deferred.promise.then(function () {
                    if (!self.channels[Const.TEST_CID]) {
                        throw "no test channel";
                    } else {
                        return self.channels[Const.TEST_CID];
                    }
                });
            })
            .then(function (mc) {
                setTimeout(mc.nextMusic.bind(mc), 5000);
            });
    }
};

exports.musicChannelManager = musicChannelManager;
