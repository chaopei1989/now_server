/**
 * Created by chaopei on 2015/10/1.
 */
var ChannelMusic = function () {
    /**
     * id
     * @type {number}
     */
    this.id = 0;
    /**
     * 频道id
     * @type {number}
     */
    this.channelId = 0;
    /**
     * 音乐id
     * @type {number}
     */
    this.musicId = 0;
    /**
     * 用户id
     * @type {number}
     */
    this.userId = 0;
    /**
     * 赞
     * @type {number}
     */
    this.like = 0;
    /**
     * 踩
     * @type {number}
     */
    this.dislike = 0;;
    /**
     * 被切了
     * @type {number}
     */
    this.passed = 0;
    /**
     * 点歌时间
     * @type {null}
     */
    this.time = null;
};
exports.ChannelMusic = ChannelMusic;