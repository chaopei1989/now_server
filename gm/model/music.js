
var util = require('../util');


var Music = function() {
    this.musicId = 0;
    /**
     * 歌曲Url
     * @type {String}
     */
    this.url = null;
    /**
     * 专辑
     * @type {String}
     */
    this.album = null;
    /**
     * 歌曲名
     * @type {String}
     */
    this.title = null;
    /**
     * 封面
     * @type {String}
     */
    this.cover = null;
    /**
     * 歌曲时间
     * @type {Int32}
     */
    this.duration = 0;
    /**
     * 歌手名
     * @type {null}
     */
    this.artist = null;
    /**
     * 总赞数
     * @type {number}
     */
    this.like = 0;
    /**
     * 总踩数
     * @type {number}
     */
    this.dislike = 0;
    /**
     * 被点过几回
     * @type {number}
     */
    this.request = 0;
};

Music.prototype.toString = function () {

    return new util.template(
        '{title:"{{title}}", album:"{{album}}", url:"{{url}}", cover:"{{cover}}", artist:"{{artist}}", duration:"{{duration}}"}'
    ).render(this);
};


exports.Music = Music;