/**
 * @file 测试用例
 * @author xiaowu
 * @email fe.xiaowu@gmail.com
 */

'use strict';

var Mdjs = require('../');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var getpath = require('./getpath');

describe('options', function () {
    it('default', function () {
        try {
            new Mdjs();
            new Mdjs({});
            new Mdjs(null);
            new Mdjs(1);
            new Mdjs('1');
            new Mdjs(true);
            new Mdjs(false);
            assert.strictEqual(true, true);
        }
        catch (e) {
            assert.strictEqual(true, false);
        }
    });

    it('check', function () {
        var options = {
            name: 'test',
            port: 9991,
            static_prefix: 'test',

            test: true,
            xxoo: '1'
        };

        var app = new Mdjs(options);

        Object.keys(options).forEach(function (val) {
            assert.strictEqual(options[val], app.options[val]);
        });
    });

    it('options.root', function () {
        var app = new Mdjs({
            root: getpath.__dirname
        });
        var flag = false;

        app._md({
            url: '/doc/ok.md'
        }, {
            render: function () {
                flag = true;
            }
        }, function () {});

        assert.strictEqual(true, flag);
    });

    it('options.port', function () {
        try {
            new Mdjs({
                port: 9993
            }).run();
            new Mdjs().run();
            assert.strictEqual(true, true);
        }
        catch (e) {
            assert.strictEqual(true, false);
        }

        try {
            new Mdjs({
                port: 9999
            }).run();
            new Mdjs({
                port: 9999
            }).run();
            assert.strictEqual(true, false);
        }
        catch (e) {
            assert.strictEqual(true, true);
        }
    });

    it('options.ignore_dir', function () {
        var app = new Mdjs({
            root: getpath.doc('ignore_dir'),
            ignore_dir: [
                '我是忽略'
            ]
        });

        var data = app._get_list();

        assert.strictEqual(1, data.children.length);
    });

    it('options.links empty', function () {
        new Mdjs({
            links: ''
        });
        new Mdjs({
            links: null
        });
        new Mdjs({
            links: []
        });
    });

    it('options.links - type default', function () {
        var app = new Mdjs({
            root: getpath.__dirname,
            links: [
                {
                    text: '前端小武',
                    url: 'https://xuexb.com/'
                }
            ],
            // 这里是为了不使用缓存
            debug: true
        });

        var data = app.get_list();

        assert.deepEqual(app.options.links[0], data[0]);
    });

    it('options.links - type after', function () {
        var app = new Mdjs({
            root: getpath.__dirname,
            links: [
                {
                    text: '前端小武',
                    url: 'https://xuexb.com/',
                    type: 'after'
                }
            ],
            // 这里是为了不使用缓存
            debug: true
        });

        var data = app.get_list();

        assert.deepEqual(app.options.links[0], data[data.length - 1]);

        app.clear_cache();
    });

    it('options.debug:true', function () {
        var cache_path = getpath.temp('options.debug:true');
        var app = new Mdjs({
            root: path.resolve(__dirname),
            cache_path: cache_path,
            debug: true
        });

        // 读取列表，让其写入缓存
        app.get_list();

        // 如果缓存目录不存在算成立
        assert.strictEqual(false, fs.existsSync(cache_path));
    });

    it('options.debug:false', function () {
        var cache_path = getpath.temp('options.debug:false');
        var app = new Mdjs({
            root: path.resolve(__dirname),
            cache_path: cache_path,
            debug: false
        });

        // 读取列表，让其写入缓存
        app.get_list();

        // 判断缓存目录里有没有文件
        assert.strictEqual(true, fs.readdirSync(cache_path).length > 0);

        // 清空
        app.clear_cache();
    });

    it('package options', function () {
        var packpath = path.resolve('./package.json');
        var backdata = fs.readFileSync(packpath).toString();

        var ok = JSON.parse(backdata);
        ok.mdjs = {
            xxoo: true,
            json: true,
            static_prefix: 'xxoo'
        };
        // 写入ok的数据
        fs.writeFileSync(packpath, JSON.stringify(ok, null, 4));

        // 清除require缓存
        delete require.cache[packpath];
        var okapp = new Mdjs({
            json: 'ok'
        });

        // 使用try保证即使出错原始的package.json不被重写
        try {
            // 实例化的参数
            assert.strictEqual('ok', okapp.options.json);

            // json参数
            assert.strictEqual(true, okapp.options.xxoo);

            // 覆盖默认的参数
            assert.strictEqual('xxoo', okapp.options.static_prefix);
        }
        catch (e) {
            assert.strictEqual(true, false);
        }
        finally {
            fs.writeFileSync(packpath, backdata);
        }
    });

    it('package options - parse error', function () {
        var packpath = path.resolve('./package.json');
        var backdata = fs.readFileSync(packpath).toString();

        // 写入parse error的数据
        fs.writeFileSync(packpath, '{');

        // 清除require缓存
        delete require.cache[packpath];

        try {
            new Mdjs({
                json: 'ok'
            });
            assert.strictEqual(true, true);
        }
        catch (e) {
            assert.strictEqual(true, false);
        }
        finally {
            fs.writeFileSync(packpath, backdata);
        }
    });
});
