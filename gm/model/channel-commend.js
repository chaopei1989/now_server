/**
 * 点赞/踩情况
 * @constructor
 */
var ChannelCommend = function() {
    /**
     * id
     * @type {number}
     */
    this.id = 0;
    /**
     * >0-赞，<0-踩, 0-不评价
     * @type {number}
     */
    this.type = 0;
    /**
     * 点赞/踩人
     * @type {ObjectId}
     */
    this.userId = null;
    /**
     * 被赞/踩的哪一次点歌
     * @type {ObjectId}
     */
    this.channelMusicId = null;
    /**
     * 赞或踩的时间
     * @type {null}
     */
    this.time = null;
};

exports.ChannelCommend = ChannelCommend;