/**
 * Created by chaopei on 2015/9/9.
 */
var util = require('./util');

var NetConst = {
    /** 数据库连接错误 */
    STATUS_DATABASE_ERR:-4,
    /** 未授权 */
    STATUS_ILLEGAL_AUTH:-3,
    /** 参数非法 */
    STATUS_ILLEGAL_ARGS:-2,
    /** 未知内部错误 */
    STATUS_INTERNAL_ERR:-1,
    /** 请求成功 */
    STATUS_OK:0,
    /** 频道不存在 */
    STATUS_CHANNEL_NOT_EXIST:1,

    ERR_NO_SUCH_USER : -1024,

    ERR_NO_SUCH_MUSIC : -1025,

    ERR_NO_SUCH_CHANNEL : -1026,

    ERR_CHANNEL_EXIST : -1027,

    ERR_DUPLICATED : -1028,



    ERR_NOT_READY_YET : -1030,

    err : function(status, msg) {
        return new Error(status, msg);
    }
};

function Error(status, msg) {
    this.status = status;
    this.msg = msg;
}

function Response() {
    this.status=0;
    this.msg=null;
    this.data = {
        len:0,
        obj:[]
    };
}

Response.createOK = function(obj) {
    var data;
    if (null != obj) {
        if (obj.constructor === Array) {
            data = obj;
        } else {
            data = [obj,];
        }
    } else {
        data = [];
    }
    var r = new Response();
    r.status = 0;
    r.msg = '';
    r.data = {
        len:data.length,
        obj:data
    };
    return r;
};

Response.createError = function (status, msg) {
    var r = new Response();
    if(isNaN(status)) {
        status = NetConst.STATUS_INTERNAL_ERR;
    }
    if(null == msg) {
        msg = 'unknown';
    } else if(typeof msg != 'string'){
        msg = 'unknown : ' + msg;
    }
    r.status = status;
    r.msg = msg;
    r.data = null;
    return r;
};

exports.Response = Response;

exports.Error = Error;

exports.netConst = NetConst;