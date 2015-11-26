/**
 * @file 获取测试路径
 * @author xiaowu
 * @email fe.xiaowu@gmail.com
 */

'use strict';

var path = require('path');

module.exports = {
    temp: function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(__dirname, './temp/');
        return path.resolve.apply(path, args);
    },
    doc: function (name) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(__dirname, './doc/');
        return path.resolve.apply(path, args);
    },
    __dirname: path.resolve(__dirname)
};
