/**
 * Created by chaopei on 2015/10/1.
 * 用户歌单
 */
var UserMusic = function () {
    this.id = 0;
    /**
     * 用户id
     * @type {number}
     */
    this.userId = 0;
    /**
     * 音乐id
     * @type {number}
     */
    this.musicId = 0;
    /**
     * 赞数
     * @type {number}
     */
    this.like = 0;
    /**
     * 踩数
     * @type {number}
     */
    this.dislike = 0;
};

/**
 * 用户赞和踩的音乐列表
 * @constructor
 */
var UserLikeMusic = function () {
    this.id = 0;
    /**
     * 用户id
     * @type {number}
     */
    this.userId = 0;
    /**
     * 歌曲id
     * @type {number}
     */
    this.musicId = 0;
    /**
     * 0-赞， 1-踩
     * @type {number}
     */
    this.type = 0;
};