/**
 * Created by chaopei on 2015/9/7.
 */

var dao = require('../dao/index');

module.exports = {
    INVALID_CID: 0,
    TEST_CID: 1024,
    TEST_CNAME: '正在写作业...',

    INIT_TEST_MUSICS: function () {
        return dao.impl.addMusics([{
            title: '罗生门',
            artist: '麦浚龙谢安琪',
            album: null,
            url: 'http://sc1.111ttt.com/2015/1/07/23/100231627250.mp3',
            duration: 262000
        },{
            title: 'What Do You Mean',
            artist: '贾斯丁比伯',
            album: null,
            url: 'http://sc1.111ttt.com/2015/1/09/08/102081139048.mp3',
            duration: 207000
        },{
            title: '能不能给我一首歌的时间',
            artist: '周杰伦',
            album: '跨时代',
            url: 'http://sc.111ttt.com/up/mp3/283884/88843A07D55855AE1E70CEBE99F5AA68.mp3',
            duration: 253000
        },{
            title: '钢琴舞曲-棋魂走到尽头',
            artist: null,
            album: null,
            url: 'http://sc1.111ttt.com/2015/1/09/07/102071336273.mp3',
            duration: 251000
        },{
            title: '一路向北',
            artist: '周杰伦',
            album: '头文字D',
            url: 'http://sc.111ttt.com/up/mp3/262586/D27AC62747FF86F39ACF38A32979ABDD.mp3',
            duration: 295000
        },{
            title: '齐天大圣-我们都寂寞',
            artist: '蒙面歌王',
            album: null,
            url: 'http://sc1.111ttt.com/2015/1/09/06/102062333352.mp3',
            duration: 301000
        }]);
    },

    /**
     * 每首歌前后误差5秒
     */
    MUSIC_WAIT: 5000,

    NAMESPACE: '/channel',
    /**
     * 连接成功
     */
    EVENT_CONNECTION: 'connection',
    /**
     * 连接断开
     */
    EVENT_DISCONNECT: 'disconnect',
    /**
     * 加入指定频道，客户端到服务器的事件
     */
    EVENT_JOIN_CS: 'join_cs',
    /**
     * 加入指定频道，服务器到客户端的事件
     */
    EVENT_JOIN_SC: 'join_sc',
    /**
     * 切歌，让播放器准备好，服务器到客户端的事件
     */
    EVENT_MUSIC_NEXT_SC: 'next_sc',
    /**
     * 播放当前歌曲，服务器到客户端的事件
     */
    EVENT_PLAY_SC: 'play_sc',
    /**
     * 心跳，客户端到服务器的事件
     */
    EVENT_HEART_CS: 'heart_cs',
    /**
     * 心跳，服务器到客户端的事件
     */
    EVENT_HEART_SC: 'heart_sc',
    /**
     *
     */
    EVENT_LIKE_DISLIKE_SC: 'like_dislike_sc',

    MUSIC_STATE: {
        OVER: -1,
        PREPARED: 0,
        PLAYING: 1
    }

};