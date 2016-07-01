var express = require('express');
var router = express.Router();
var service = require('../service/index');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/**
 * 用户登录或注册
 */
router.post('/user/login', function (req, res) {
    service.userLogin(req, res);
});

/**
 * 点歌
 */
router.post('/channel/request', function (req, res) {
    service.channelRequest(req, res);
});

/**
 * 点赞/踩
 */
router.post('/channel/commend', function (req, res) {
    service.channelCommend(req, res);
});

/**
 * 获取频道中所有用户
 */
router.get('/channel/:channelId/users/all', function (req, res) {
    service.channelUsersAll(req, res);
});

/**
 * 获取频道中所有歌曲
 */
router.get('/channel/:channelId/musics', function (req, res) {
    service.channelMusics(req, res);
});

/**
 * 获取频道中当前播放的歌曲
 */
router.get('/channel/:channelId/users/curr', function (req, res) {
    service.channelUsersCurr(req, res);
});

/**
 * 获取搜歌api
 */
router.get('/api', function (req, res) {
    service.api(req, res);
});

/**
 *
 */
router.get('/user/icon', function (req, res) {
    service.userIcon(req, res);
});


module.exports = router;
