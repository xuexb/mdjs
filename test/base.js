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
var request = require('request');

var getpath = require('./getpath');

var get_app_md_request = function (req, res, next) {
    return new Mdjs({
        root: getpath.__dirname
    })._md(req, res, next);
};

describe('base', function () {

    it('new', function(){
        try {
            Mdjs();
            assert.strictEqual(true, false);
        }
        catch(e){
            assert.strictEqual(true, true);
        }
    });

    // 获取md标题
    it('_get_md_title .md', function () {
        var filepath = path.resolve(__dirname, './doc/markdown.md');

        var title = new Mdjs()._get_md_title(filepath);

        assert.strictEqual('title', title);
    });

    // 获取非md标题
    it('_get_md_title not .md', function () {
        var filepath = '/test/test/1.html';

        var title = new Mdjs()._get_md_title(filepath);

        assert.strictEqual('1.html', title);
    });

    // url中有需要读取源
    it('_md url ?source=1', function () {
        var testurl = '/doc/markdown.md?source=1';
        var flag = false;
        get_app_md_request({
            url: testurl
        }, {}, function () {
            flag = true;
        });

        assert.strictEqual(true, flag);
    });

    // md未找到，进入下一个路由
    it('_md not found', function () {
        var testurl = '/doc/no-found.md';
        var flag = false;
        get_app_md_request({
            url: testurl
        }, {}, function () {
            flag = true;
        });

        assert.strictEqual(true, flag);
    });

    // pjax验证，只输出md
    it('_md url is pjax', function () {
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

    // render
    it('_md render', function () {
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

    it('_md url is 中文/空格', function () {
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

    it('_md url is 中文/空格 - encodeURIComponent', function () {
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

    it('_get_list()', function () {
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

    it('_get_list-empty path', function () {
        var app = new Mdjs({
            root: getpath.doc('empty path')
        });

        var data = app._get_list();

        assert.strictEqual('/', data.uri);
        assert.strictEqual('empty path', data.text);
        assert.strictEqual(1, data.children.length);
    });

    it('locals', function(done){
        var app = new Mdjs({
            port: 8394,
            name: 'locals',
            root: getpath.__dirname
        });

        var flag = null;

        app.express.use(function(req, res, next){
            flag = res.locals.options.name;
        });

        app.run();

        setTimeout(function(){
            done();
        }, 4000);
    });
});
