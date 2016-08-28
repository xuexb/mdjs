'use strict';

var Mdjs = require('./');

var app = new Mdjs({
    static_prefix: 'test',
    debug: true,
    root: '/Users/baidu/work/baidugit/ala-weeklyreport'
}).run();

app.express.all('/api/update', function (req, res, next) {
    // 更新代码
        // 清缓存
        app.reset();
            res.end('ok');
});