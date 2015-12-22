/**
 * @file 测试用例
 * @author xiaowu
 * @email fe.xiaowu@gmail.com
 */

'use strict';

var Mdjs = require('../');
var assert = require('assert');
var url = require('url');

var getpath = require('./getpath');

/**
 * 获取测试md功能
 *
 * @param  {Object}   req  req
 * @param  {Object}   res  res
 * @param  {Function} next 模拟下个路由
 *
 * @return {Object}        mdjs实例
 */
var get_app_md_request = function (req, res, next) {
    return new Mdjs({
        root: getpath.__dirname
    })._md(req, res, next);
};

describe('base', function () {
    it('check new instantiation', function () {
        try {
            var mdjs = Mdjs;
            mdjs();
            assert.strictEqual(true, false);
        }
        catch (e) {
            assert.strictEqual(true, true);
        }
    });


    // md未找到，进入下一个路由
    it('md file not find', function () {
        var testurl = '/doc/no-found.md';
        var flag = false;
        get_app_md_request({
            url: testurl
        }, {}, function () {
            flag = true;
        });

        assert.strictEqual(true, flag);
    });


    // render
    it('render markdown', function () {
        var testurl = '/doc/ok.md';
        var flag = false;
        get_app_md_request({
            url: testurl
        }, {
            render: function () {
                flag = true;
            }
        }, function () {});

        assert.strictEqual(true, flag);
    });

    describe('check url', function () {
        // url中有需要读取源
        it('Display source => ?source=1', function () {
            var testurl = '/doc/markdown.md?source=1';
            var flag = false;
            get_app_md_request({
                url: testurl
            }, {}, function () {
                flag = true;
            });

            assert.strictEqual(true, flag);
        });
        // pjax验证，只输出md
        it('Request is pjax', function () {
            var testurl = '/doc/ok.md?pjax=1';
            var flag = '';
            get_app_md_request({
                url: testurl
            }, {
                end: function (html) {
                    flag = html;
                }
            }, function () {});

            assert.strictEqual('<p>ok</p>\n', flag);
        });
        it('url multi-parameter test', function () {
            var testurl = '/doc/ok.md?name=key-cache&author=xiaowu#author';
            var flag = false;
            get_app_md_request({
                url: testurl
            }, {
                render: function () {
                    flag = true;
                }
            }, function () {});

            assert.strictEqual(true, flag);
        });

        it('Chinese and spaces url detection', function () {
            var testurl = '/doc/中方+ 空格  la/中文 空格 的 la.md';
            var flag = false;
            get_app_md_request({
                url: testurl
            }, {
                render: function () {
                    flag = true;
                }
            }, function () {});

            assert.strictEqual(true, flag);
        });

        it('Chinese and spaces url detection - encodeURIComponent', function () {
            var testurl = '/doc/中方+ 空格  la/中文 空格 的 la.md';
            var flag = false;
            get_app_md_request({
                url: encodeURIComponent(testurl)
            }, {
                render: function () {
                    flag = true;
                }
            }, function () {});

            assert.strictEqual(true, flag);
        });
    });

    describe('_get_list', function () {
        it('return value', function () {
            var app = new Mdjs({
                root: getpath.doc('_get_list')
            });

            var data = app._get_list();

            assert.strictEqual('/', data.uri);
            assert.strictEqual('_get_list', data.text);
            assert.strictEqual(2, data.children.length);
            assert.strictEqual('1', data.children[1].text);
            assert.strictEqual('/1.md', data.children[1].uri);
        });

        it('directory is empty', function () {
            var app = new Mdjs({
                root: getpath.doc('empty path')
            });

            var data = app._get_list();

            assert.strictEqual('/', data.uri);
            assert.strictEqual('empty path', data.text);
            assert.strictEqual(1, data.children.length);
        });

        it('directory not found', function () {
            var filepath = getpath.doc('空空空' + Date.now());
            var app = new Mdjs({
                debug: true,
                root: filepath
            });

            assert.strictEqual(0, app.get_list().length);
        });
    });

    it('locals', function () {
        var app = new Mdjs({
            port: 8394,
            name: 'locals',
            root: getpath.__dirname
        });

        var result = {
            locals: {}
        };
        var noop = function () {};

        app.express = {
            engine: noop,
            set: noop,
            get: noop,
            use: function (fn) {
                if ('function' === typeof fn) {
                    fn.call(app, {}, result, noop);
                }

            }
        };

        // 重新初始化
        app._init_express();

        assert.deepEqual(app.options, result.locals.options);
    });

    /**
     * 测试默认主页功能
     *
     * @param  {Object}   req      req
     * @param  {Object}   res      res
     * @param  {Function} next     模拟下个路由
     * @param  {Function} callback 测试回调
     */
    var test_default = function (req, res, next, callback) {
        var app = new Mdjs({
            port: 8394,
            root: getpath.doc()
        });
        var noop = function () {};

        app.express = {
            engine: noop,
            set: noop,
            use: noop,
            get: function (reg, fn) {
                // reg必须是正则
                if ('object' !== typeof reg || reg.constructor !== RegExp) {
                    return;
                }

                // 如果验证没通过
                if (!reg.test(url.parse(req.url).pathname)) {
                    return;
                }

                // 执行回调
                fn.call(app, req, res, next);

                callback();
            }
        };

        // 重新初始化
        app._init_express();
    };

    describe('default index', function () {
        it('not found', function () {
            var flag = false;
            test_default({
                url: '/doc/?name=key-cache&author=xiaowu#xxoo'
            }, {}, function () {
                flag = true;
            }, function () {
                assert.strictEqual(true, flag);
            });
        });

        it('success', function () {
            var flag = false;
            test_default({
                url: '/default index/?name=key-cache&author=xiaowu#xxoo'
            }, {
                render: function () {
                    flag = true;
                }
            }, function () {}, function () {
                assert.strictEqual(true, flag);
            });
        });

        it('?source=1', function () {
            var flag = false;
            test_default({
                url: '/default index/?name=key-cache&source=1#xxoo'
            }, {
                render: function () {}
            }, function () {
                flag = true;
            }, function () {
                assert.strictEqual(true, flag);
            });
        });
    });

});
