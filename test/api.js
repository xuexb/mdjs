/**
 * @file 测试用例
 * @author xiaowu
 * @email fe.xiaowu@gmail.com
 */

'use strict';

var Mdjs = require('../');
var assert = require('assert');
var path = require('path');
var fs = require('fs');

var getpath = require('./getpath');

describe('api', function () {
    // 运行2个，当第2个占用端口时表示成功
    it('run', function () {
        try {
            new Mdjs().run();
            new Mdjs().run();
            assert.strictEqual(true, false);
        }
        catch (e) {
            assert.strictEqual(true, true);
        }
    });

    it('run() => return', function () {
        var app = new Mdjs();

        assert.strictEqual(true, app === app.run());
    });

    it('renderMarkdown() => return', function () {
        var app = new Mdjs();

        assert.strictEqual('object', typeof app.renderMarkdown());
        assert.strictEqual('', app.renderMarkdown().content);
        assert.strictEqual('object', typeof app.renderMarkdown().catalog);
        assert.strictEqual(0, app.renderMarkdown().catalog.length);
    });

    it('renderMarkdown(str)', function () {
        var app = new Mdjs();
        var filepath = getpath.doc('renderMarkdown(str)', '1.md');
        var filedata = fs.readFileSync(filepath).toString();
        var data = app.renderMarkdown(filedata);

        assert.strictEqual(4, data.catalog.length);

        // 语言验证
        assert.strictEqual(true, data.content.indexOf('<pre><code class="hljs lang-js">') !== -1);
        assert.strictEqual(true, data.content.indexOf('<pre><code class="hljs lang-css">') !== -1);

        // 语言tips验证
        assert.strictEqual(true, data.content.indexOf('<span class="hljs-lang-tips">js</span>') !== -1);

        // 空语言验证
        assert.strictEqual(true, data.content.indexOf('<pre><code class="hljs">') !== -1);
    });

    it('renderMarkdown(str) - todo', function () {
        var app = new Mdjs();
        var filepath = getpath.doc('renderMarkdown(str)', '1.md');
        var filedata = fs.readFileSync(filepath).toString();
        var data = app.renderMarkdown(filedata).content;

        // todo支持验证
        assert.strictEqual(true, data.indexOf('<li><input type="checkbox" class="ui-todo" disabled>') !== -1);
        assert.strictEqual(true, data.indexOf('<li><input type="checkbox" disabled checked class="ui-todo">') !== -1);
    });

    it('get_render_nav() - empty', function () {
        var app = new Mdjs();

        // 重写方法使其没数据
        app.get_list = function () {
            return [];
        };

        assert.strictEqual('', app.get_render_nav());
    });

    it('get_render_nav()', function () {
        var app = new Mdjs({
            root: getpath.__dirname
        });

        // 判断有没有导航选中的类
        assert.strictEqual(true, app.get_render_nav().indexOf('nav-tree-current') === -1);

        // 清空缓存
        app.clear_cache();
    });

    it('get_render_nav(uri)', function () {
        var app = new Mdjs({
            root: getpath.__dirname
        });

        var html = app.get_render_nav('/doc/get_render_nav/1.md');
        var data = html.match(/<li class=\"nav-tree-file nav-tree-current\">([\s\S]+?)<\/li>/);
        assert.strictEqual(true, !!data);

        if (data && data.length) {
            assert.strictEqual(true, data[1].indexOf('/doc/get_render_nav/1.md') > -1);
        }

        // 清空缓存
        app.clear_cache();
    });

    it('clear_cache()', function () {
        var cache_path = getpath.temp('clear_cache()');
        var app = new Mdjs({
            root: path.resolve(__dirname),
            cache_path: cache_path,
            debug: false
        });

        // 读取列表，让其写入缓存
        app.get_list();

        // 判断缓存目录里有没有文件
        assert.strictEqual(true, fs.readdirSync(cache_path).length > 0);

        // 清空缓存
        app.clear_cache();

        // 判断缓存目录里有没有文件
        assert.strictEqual(true, fs.readdirSync(cache_path).length === 0);
    });

    it('clear_cache() => return ', function () {
        var app = new Mdjs();

        assert.strictEqual(true, app === app.clear_cache());
    });

    it('get_list() - empty', function () {
        var app = new Mdjs();

        app._get_list = function () {
            return {};
        };

        assert.strictEqual(true, Array.isArray(app.get_list()));
        assert.strictEqual(0, app.get_list().length);
    });
});
