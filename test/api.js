/**
 * @file 测试用例
 * @author xiaowu
 * @email fe.xiaowu@gmail.com
 */

'use strict';

var Mdjs = require('../');
var assert = require('assert');
var fs = require('fs');

var getpath = require('./getpath');

var strictEqual = assert.strictEqual;

describe('api', function () {
    // 运行2个，当第2个占用端口时表示成功
    describe('run', function () {
        it('start state', function () {
            try {
                new Mdjs().run();
                new Mdjs().run();
                strictEqual(true, false);
            }
            catch (e) {
                strictEqual(true, true);
            }
        });

        it('return value', function () {
            var app = new Mdjs();

            strictEqual(true, app === app.run());
        });
    });

    // 缓存方法判断
    describe('cache', function () {
        // 结束后清空缓存
        afterEach(function () {
            new Mdjs().clear_cache();
        });

        it('no arguments', function () {
            var app = new Mdjs();

            strictEqual(undefined, app.cache());
        });

        it('cache not exist', function () {
            var app = new Mdjs();

            strictEqual(undefined, app.cache('不存在'));
        });

        it('cached', function () {
            var app = new Mdjs();

            app.cache('存在', function () {
                return true;
            });

            strictEqual(true, app.cache('存在'));
        });

        it('open debug', function () {
            var app = new Mdjs({
                debug: true
            });

            strictEqual(undefined, app.cache('不存在'));
        });

        it('cache not exist and callback', function () {
            var app = new Mdjs();

            var flag;

            // 判断是否执行回调
            app.cache('xxoo', function () {
                flag = true;
            });
            strictEqual(true, flag);

            // 判断上面回调没返回值，则不写入缓存
            flag = app.cache('xxoo', function () {
                return 1;
            });
            strictEqual(1, 1);
        });

        it('cached and callback', function () {
            var app = new Mdjs();

            // 当没有缓存时读获取回调返回值
            var flag = app.cache('xxoo', function () {
                return true;
            });
            strictEqual(true, flag);

            // 理论上有缓存就不执行回调
            app.cache('xxoo', function () {
                flag = 0;
            });
            strictEqual(true, flag !== 0);

            // 有缓存
            strictEqual(true, app.cache('xxoo'));
        });
    });

    describe('render_markdown', function () {
        it('return value', function () {
            var app = new Mdjs();

            strictEqual('object', typeof app.render_markdown());
            strictEqual('', app.render_markdown().content);
            strictEqual('object', typeof app.render_markdown().catalog);
            strictEqual(0, app.render_markdown().catalog.length);
        });

        it('render data', function () {
            var app = new Mdjs();
            var filepath = getpath.doc('render_markdown(str)', '1.md');
            var filedata = fs.readFileSync(filepath).toString();
            var data = app.render_markdown(filedata);

            // 5个#1,#2,#3标题
            strictEqual(5, data.catalog.length);

            // 语言验证
            strictEqual(true, data.content.indexOf('<pre><code class="hljs lang-js">') !== -1);
            strictEqual(true, data.content.indexOf('<pre><code class="hljs lang-css">') !== -1);

            // 语言tips验证
            strictEqual(true, data.content.indexOf('<span class="hljs-lang-tips">js</span>') !== -1);

            // 空语言验证
            strictEqual(true, data.content.indexOf('<pre><code class="hljs">') !== -1);
        });

        it('upport todo', function () {
            var app = new Mdjs();
            var filepath = getpath.doc('render_markdown(str)', '1.md');
            var filedata = fs.readFileSync(filepath).toString();
            var data = app.render_markdown(filedata).content;

            // todo支持验证
            strictEqual(true, data.indexOf('<li><input type="checkbox" class="ui-todo" disabled>') !== -1);
            strictEqual(true, data.indexOf('<li><input type="checkbox" disabled checked class="ui-todo">') !== -1);
        });
    });

    describe('get_render_nav', function () {
        it('return value', function () {
            var app = new Mdjs({
                root: getpath.__dirname
            });

            // 判断有没有导航选中的类
            strictEqual(true, app.get_render_nav().indexOf('nav-tree-current') === -1);

            // 清空缓存
            app.clear_cache();
        });

        it('directory is empty', function () {
            var app = new Mdjs();

            // 重写方法使其没数据
            app.get_list = function () {
                return [];
            };

            strictEqual('', app.get_render_nav());
        });

        it('check default selected', function () {
            var app = new Mdjs({
                root: getpath.__dirname
            });

            var html = app.get_render_nav('/doc/get_render_nav/1.md');
            var data = html.match(/<li class=\"nav-tree-file nav-tree-current\">([\s\S]+?)<\/li>/);
            strictEqual(true, !!data);

            if (data && data.length) {
                strictEqual(true, data[1].indexOf('/doc/get_render_nav/1.md') > -1);
            }

            // 清空缓存
            app.clear_cache();
        });
    });

    describe('clear_cache', function () {
        it('Caching Status', function () {
            var cache_path = getpath.temp('clear_cache()');
            var app = new Mdjs({
                cache_path: cache_path,
                debug: false
            });

            // 读取列表，让其写入缓存
            app.get_list();

            // 判断缓存目录里有没有文件
            strictEqual(true, fs.readdirSync(cache_path).length > 0);

            // 清空缓存
            app.clear_cache();

            // 判断缓存目录里有没有文件
            strictEqual(true, fs.readdirSync(cache_path).length === 0);
        });

        it('return value', function () {
            var app = new Mdjs();

            strictEqual(true, app === app.clear_cache());
        });
    });

    describe('get_list', function () {
        afterEach(function () {
            new Mdjs().clear_cache();
        });
        it('return value', function () {
            var app = new Mdjs();

            app._get_list = function () {
                return {};
            };

            strictEqual(true, Array.isArray(app.get_list()));
            strictEqual(0, app.get_list().length);
        });

        it('return value data', function () {
            var app = new Mdjs({
                root: getpath.doc('get_list')
            });

            strictEqual(2, app.get_list().length);
        });

        it('directory not found', function () {
            var filepath = getpath.temp('not found' + Date.now());
            var app = new Mdjs({
                root: filepath
            });

            strictEqual(0, app.get_list().length);
        });
    });

    describe('get_markdown_title', function () {
        it('return value', function () {
            var filepath = getpath.doc('markdown.md');

            var title = new Mdjs().get_markdown_title(filepath);

            assert.strictEqual('title', title);

            var filepath2 = getpath.doc('ok2.md');

            var title2 = new Mdjs().get_markdown_title(filepath2);

            assert.strictEqual('ok2', title2);
        });

        it('Chinese content', function () {
            var filepath = getpath.doc('default index', 'readme.md');

            var title = new Mdjs().get_markdown_title(filepath);

            assert.strictEqual('默认主页', title);
        });

        // 获取md标题
        it('Content no title', function () {
            var filepath = getpath.doc('ok.md');

            var title = new Mdjs().get_markdown_title(filepath);

            assert.strictEqual('ok.md', title);
        });

        // 获取md标题
        it('带空格标题', function () {
            var filepath = getpath.doc('ok3.md');

            var title = new Mdjs().get_markdown_title(filepath);

            assert.strictEqual('ok3', title);
        });

        // 获取非md标题
        it('Extension is not md', function () {
            var filepath = '/test/test/1.html';

            var title = new Mdjs().get_markdown_title(filepath);

            assert.strictEqual('1.html', title);
        });
    });

    describe('#reset', function () {});
});
