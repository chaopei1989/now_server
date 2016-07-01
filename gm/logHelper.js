var Log = {};
exports.Log = Log;

var log4js = require('log4js');
var fs = require('fs');
var path = require('path');

// 配合express用的方法
exports.init = function(app, conf) {
    // 加载配置文件
    var config = null!=conf?conf:'./conf/log4js_conf.json';
    var objConfig = JSON.parse(fs.readFileSync(config, 'utf8'));
    var origLogFunc = console.log;
    var logmap = {};

// 检查配置文件所需的目录是否存在，不存在时创建
    if(objConfig.appenders){
        var baseDir = objConfig['customBaseDir'];
        var defaultAtt = objConfig['customDefaultAtt'];
        var tags = [];
        for(var i= 0, j=objConfig.appenders.length; i<j; i++){
            var item = objConfig.appenders[i];
            if(item['type'] == 'console')
                continue;

            if(defaultAtt != null){
                for(var att in defaultAtt){
                    if(item[att] == null)
                        item[att] = defaultAtt[att];
                }
            }
            if(baseDir != null){
                if(item['filename'] == null)
                    item['filename'] = baseDir;
                else
                    item['filename'] = baseDir + item['filename'];
            }
            var fileName = item['filename'];
            if(fileName == null)
                continue;
            var pattern = item['pattern'];
            if(pattern != null){
                fileName += pattern;
            }
            // if(!isAbsoluteDir(fileName))//path.isAbsolute(fileName))
            //     throw new Error('配置节' + category + '的路径不是绝对路径:' + fileName);
            var dir = path.dirname(fileName);
            // 判断日志目录是否存在，不存在时创建日志目录
            if(!fs.existsSync(dir)){
                fs.mkdirSync(dir);
            }

            var category = item['category'];
            logmap[category] = log4js.getLogger(category);
        }
    }

    // 目录创建完毕，才加载配置，不然会出异常
    log4js.configure(objConfig);

    Log.d = function(tag, msg){
        if(!tag || !logmap[tag]) {
            tag = 'default';
        }
        if(msg == null) {
            msg = '';
        }
        logmap[tag].debug(msg);
        origLogFunc(msg);
    };

    Log.i = function(tag, msg){
        if(!tag || !logmap[tag]) {
            tag = 'default';
        }
        if(msg == null) {
            msg = '';
        }
        logmap[tag].info(msg);
        origLogFunc(msg);
    };

    Log.w = function(tag, msg){
        if(!tag || !logmap[tag]) {
            tag = 'default';
        }
        if(msg == null) {
            msg = '';
        }
        logmap[tag].warn(msg);
        origLogFunc(msg);
    };

    Log.e = function(tag, msg, exp){
        if(!tag || !logmap[tag]) {
            tag = 'default';
        }
        if(msg == null) {
            msg = '';
        }
        if(exp != null) {
            msg += '\r\n' + exp;
        }
        logmap[tag].error(msg);
        origLogFunc(msg);
    };

    //页面请求日志, level用auto时,默认级别是WARN
    if(app) {
        app.use(log4js.connectLogger(logmap['express'], {level:'debug', format:':method :url'}));
    }
    console.log = function (msg) {
        Log.d(null, msg);
    }
};

// 指定的字符串是否绝对路径
function isAbsoluteDir(path){
    
    if(path == null)
        return false;
    var len = path.length;

    var isWindows = process.platform === 'win32';
    if(isWindows){
        if(len <= 1)
            return false;
        return path[1] == ':';
    }else{
        if(len <= 0)
            return false;
        return path[0] == '/';
    }

}