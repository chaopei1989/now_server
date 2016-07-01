/**
 * Created by chaopei on 2015/9/11.
 */
var fs = require('fs');

var util = require('../util');

var NetConst = require('../net').netConst;

var TEST = require('../env').TEST;

var dao = {
    pool:null,
    inited:false,
    init: function (conf_json) {
        var deferred = util.getDeferred();
        if(!dao.inited){
            var conf;
            if(!conf_json) {
                var conf_parent = JSON.parse(fs.readFileSync('./conf/mysql.json', 'utf8'));
                if(TEST){
                    conf = conf_parent.test;
                } else {
                    conf = conf_parent.online;
                }
            } else {
                conf = JSON.parse(fs.readFileSync(conf_json, 'utf8')).test;
            }
            pool = require('mysql').createPool({
                host:conf.host,
                user:conf.user,
                password:conf.password,
                database:conf.database,
                port:conf.port
            });
            if(!pool) {
                deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, 'init err'));
            } else {
                deferred.resolve();
                dao.inited = true;
            }
        } else {
            deferred.resolve();
        }
        return deferred.promise;
    },
    impl:{
        /**
         * 传入openId(Number)查找对应用户
         * @param openId
         * @param callback
         */
        findUserByOpenId: function (openId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR));
                } else {
                    conn.query('SELECT * FROM user WHERE openId=?', [openId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findUserByUserId: function (userId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR));
                } else {
                    conn.query('SELECT * FROM user WHERE userId=?', [userId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findUserByUserIdOpenId: function (userId, openId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT * FROM user WHERE userId=? AND openid=?', [userId, openId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        addChannelCommend : function (userId, channelMusicId, type) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('INSERT channel_commend(userId,channelMusicId,type) VALUES(?,?,?)', [userId, channelMusicId, type], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        addUserLikeMusic : function (userId, musicId, type) {
            if (1 < type) {
                type = 1;
            }
            if (-1 > type) {
                type = -1;
            }
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('INSERT user_like_music(`userId`,`musicId`,`type`) VALUES(?,?,?)', [userId, musicId, type], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        updateMusicAddLikeById : function (musicId, like, dislike) {
            var deferred = util.getDeferred();
            dao.impl.findMusicById(musicId)
                .then(function (rows) {
                    if(0 === rows.length) {
                        deferred.reject(NetConst.err(NetConst.ERR_NO_SUCH_MUSIC));
                    } else {
                        var music = rows[0];
                        pool.getConnection(function (err, conn) {
                            if(err) {
                                deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                            } else {
                                conn.query('UPDATE music SET `like`=?, `dislike`=? WHERE `musicId`=?', [music.like+like, music.dislike+dislike, musicId], function (err, res) {
                                    if(err) {
                                        deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                                    } else {
                                        deferred.resolve(res);
                                    }
                                    conn.release();
                                });
                            }
                        });
                    }
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        updateChannelMusicById : function (id, like, dislike, passed) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('UPDATE channel_music SET `like`=?, `dislike`=?, `passed`=? WHERE `id`=?', [like, dislike, passed, id], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findUserMusic : function (userId, musicId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR));
                } else {
                    conn.query('SELECT * FROM user_music WHERE userId=? AND musicId=?', [userId, musicId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        updateUserMusicLike : function (userId, musicId, like, dislike) {
            var deferred = util.getDeferred();
            dao.impl.findUserMusic(userId, musicId)
                .then(function (rows) {
                    if(0 === rows.length) {
                        deferred.reject(NetConst.err(NetConst.ERR_NO_SUCH_MUSIC));
                    } else {
                        var userMusic = rows[0];
                        pool.getConnection(function (err, conn) {
                            if(err) {
                                deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                            } else {
                                conn.query('UPDATE user_music SET `like`=?, `dislike`=? WHERE `userId`=? AND `musicId`=?', [userMusic.like+like, userMusic.dislike+dislike, userId, musicId], function (err, res) {
                                    if(err) {
                                        deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                                    } else {
                                        deferred.resolve(res);
                                    }
                                    conn.release();
                                });
                            }
                        });
                    }
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        addUser : function(data) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('INSERT user(iconUrl,openId,token,expiresTime,userName,gender,type) VALUES(?,?,?,?,?,?,?)', [data.iconUrl,data.openId,data.token,data.expiresTime,data.userName,data.gender,data.type], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        addUserMusic : function(userId, musicId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('INSERT user_music(userId,musicId) VALUES(?,?)', [userId, musicId], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        /**
         * 批量添加音乐
         * @param musics
         * @returns {*}
         */
        addMusics : function(musics) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    var values = '';
                    var s = '';
                    musics.forEach(function (music) {
                        values = values + s + new util.template('("{{title}}","{{artist}}","{{album}}","{{url}}",{{duration}})')
                            .render(music);
                        s = ',';
                    });
                    var sql = 'INSERT music(title,artist,album,url,duration) VALUES' + values;
                    console.log(sql);
                    conn.query('INSERT music(title,artist,album,url,duration) VALUES' + values, function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        /**
         *
         * @param title
         * @param url
         * @param cover
         * @param album
         * @param artist
         * @param duration
         * @returns {*}
         */
        addMusic : function(title,url,cover,album,artist,duration) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('INSERT music(title,url,cover,album,artist,duration) VALUES(?,?,?,?,?,?)', [title,url,cover,album,artist,duration], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        /**
         *
         * @param userId
         * @param userName
         * @param iconUrl
         * @param gender
         * @returns {*}
         */
        updateUserNameIconUrlGenderById : function (userId, userName, iconUrl, gender) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('UPDATE user SET userName=?, iconUrl=?, gender=? WHERE userId=?', [userName, iconUrl, gender, userId], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        /**
         * 按channelId更新playingIndex
         * @param channelId
         * @param playingIndex
         * @returns {*}
         */
        updatePlayingIndexByChannelId : function(channelId, playingIndex) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('UPDATE channel SET playingIndex=? WHERE channelId=?', [playingIndex, channelId], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        updateChannelAddMusic : function(channelId, url, album, title, duration, artist, userId, userName, iconUrl) {
            var deferred = util.getDeferred();
            dao.collection('channel').updateOne({channelId:channelId}, {$push:{
                url:url,
                title:title,
                artist:artist,
                album:album,
                duration:duration,

                userId:userId,
                userName:userName,
                iconUrl:iconUrl,

                like:0,
                dislike:0
            }}, function(err, result) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, 'updateChannelAddMusic'));
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        },
        updateUserAddMusic : function(userId, url, album, title, duration, artist) {
            var deferred = util.getDeferred();
            dao.collection('user').updateOne({userId:userId}, {$push:{
                musics:{
                    url:url,
                    title:title,
                    artist:artist,
                    album:album,
                    duration:duration
                }
            }}, function(err, result) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, 'updateUserAddMusic'));
                } else {
                    deferred.resolve(result);
                }
            });
            return deferred.promise;
        },
        /**
         *
         * @param musicId
         * @param request
         * @returns {*}
         */
        updateMusicRequest : function(musicId, request) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('UPDATE music SET request=? WHERE musicId=?', [request, musicId], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findChannels : function() {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT * FROM channel', function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findChannelByChannelId : function(channelId) {
            var deferred = util.getDeferred();
            dao.collection('channel').findOne({channelId:channelId}, function (err, document) {
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(document);
                }
            });
            return deferred.promise;
        },
        addChannel : function (channel) {
            var deferred = util.getDeferred();
            dao.db.collection('channel').insertOne(channel, null, function (err, item) {
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(item);
                }
            });
            return deferred.promise;
        },
        findMusicByChannelId : function (channelId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT * FROM channel_music WHERE channelId=?', [channelId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findMusicById : function (musicId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT * FROM music WHERE musicId=?', [musicId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findChannelMusicAfterId : function (id) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT music.*,user.userId,user.userName,user.iconUrl FROM music JOIN channel_music JOIN user ON id>=? AND music.musicId=channel_music.musicId AND user.userId=channel_music.userId', [id], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findUserById : function (userId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT userId,userName,iconUrl,gender,type,privilege FROM user WHERE userId=?', [userId], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findUserByIds : function (ids) {
            var deferred = util.getDeferred();
            if(null == ids || 0 === ids.length) {
                deferred.resolve([]);
            } else {
                pool.getConnection(function (err, conn) {
                    if(err) {
                        deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                    } else {
                        conn.query('SELECT userId,userName,iconUrl,gender,type,privilege FROM user WHERE userId in ('+ids+')', function (err, rows) {
                            if(err) {
                                deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                            } else {
                                deferred.resolve(rows);
                            }
                            conn.release();
                        });
                    }
                });
            }
            return deferred.promise;
        },
        findChannelMusicById : function (id) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT * FROM channel_music WHERE id=?', [id], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        findMusicByUrl : function (url) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('SELECT * FROM music WHERE url=?', [url], function (err, rows) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(rows);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        },
        /**
         * 添加音乐到频道
         * @param channelId
         * @param musicId
         * @param userId
         * @returns {*}
         */
        insertChannelMusic : function (channelId, musicId, userId) {
            var deferred = util.getDeferred();
            pool.getConnection(function (err, conn) {
                if(err) {
                    deferred.reject(NetConst.err(NetConst.STATUS_DATABASE_ERR, err));
                } else {
                    conn.query('INSERT channel_music(channelId, musicId, userId) VALUES(?,?,?)', [channelId, musicId, userId], function (err, res) {
                        if(err) {
                            deferred.reject(NetConst.err(NetConst.STATUS_INTERNAL_ERR, err));
                        } else {
                            deferred.resolve(res);
                        }
                        conn.release();
                    });
                }
            });
            return deferred.promise;
        }
    }
};

module.exports = dao;
