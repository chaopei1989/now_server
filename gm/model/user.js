/**
 * 用户表
 * @constructor
 */
var User = function () {
    /**
     * 对应数据库为_id
     * @type {ObjectId}
     */
    this.userId = null;
    /**
     * 头像url
     * @type {String}
     */
    this.iconUrl = null;
    /**
     * @type {String}
     */
    this.openId = null;
    /**
     * @type {String}
     */
    this.token = null;
    /**
     * @type {Double}
     */
    this.expiresTime = 0;
    /**
     * 用户名
     * @type {String}
     */
    this.userName = null;
    /**
     * 性别
     * @type {Int32}
     */
    this.gender = 0;
    /**
     * 帐号类型
     * @type {Int32}
     */
    this.type = 0;
    /**
     * 特权
     */
    this.privilege = 0;
};

exports.User = User;