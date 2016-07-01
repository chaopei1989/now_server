
var Channel = function() {
    /**
     * 频道号
     * @type {number}
     */
    this.channelId = 1024;
    /**
     * 频道类型，0-音乐频道
     * @type {number}
     */
    this.type = 0;
    /**
     * 频道名字
     * @type {String}
     */
    this.channelName = null;
    /**
     * 播放序列
     * @type {number}
     */
    this.playingIndex = -1;

};

exports.Channel = Channel;