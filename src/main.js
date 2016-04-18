/**
 * @file mdjs
 * @author xiaowu
 * @email fe.xiaowu@gmail.com
 */

'use strict';

import template from 'art-template/node/template-native';
import {slugify} from 'transliteration';
import express from 'express';
import serve_static from 'serve-static';
import serve_index from 'serve-index';

import {existsSync, readdirSync, statSync, readFileSync} from 'fs';
import {parse, format} from 'url';
import {resolve, dirname, basename, extname, sep} from 'path';

import Key_cache from 'key-cache';

import marked from 'marked';
import highlight from 'highlight.js';

import OPTIONS from './options';

export default class Mdjs {
    /**
     * 构造器
     *
     * @param  {Object} options 配置参数
     */
    constructor(options = {}) {
        let package_options;
        try {
            package_options = require(resolve('./package.json')).mdjs;
        }
        catch (e) {
            package_options = {};
        }

        // 合并默认配置
        // 合并的顺序是： 参数 > package.mdjs > 默认 （由左向右合并）
        options = this.options = {...OPTIONS, ...package_options, ...options};

        options.root = resolve(options.root);
        options.cache_path = resolve(options.cache_path);

        // 缓存当前运行的目录
        this.__dirname = dirname(__dirname);

        // 缓存express
        this.express = express();

        // 初始化express
        this._init_express();
    }

    /**
     * 获取渲染后的导航html代码
     *
     * @param  {string|undefined} uri 当前高亮的路径，如果为空则全不高亮， 高亮即展开
     *
     * @return {string}     html代码
     */
    get_render_nav(id) {
        let data = this.get_list();
        let str = '';

        if (!data || !data.length) {
            return str;
        }

        if (id) {
            id = decodeURIComponent(id);
        }

        let filter = (filepath, type) => {
            if (!id) {
                return false;
            }

            if (type === 'dir') {
                return id.indexOf(filepath + '/') === 0;
            }
            return id === filepath;
        };

        console.log(id)

        let fn = (res) => {
            res.forEach((val) => {
                val.icon = false;
                val.uri = slugify(val.text, {separator: ''});

                if (!val.children || !val.children.length) {
                    if (filter(val.id, 'file')) {
                        val.state = {
                            // opened: true,
                            selected: true
                        }
                    }
                }
                else {
                    if (filter(val.id, 'dir')) {
                        val.state = {
                            opened: true
                        }
                    }

                    fn(val.children);
                }
            });
        };


        fn(data);

        return data;
    }

    /**
     * 清空缓存
     *
     * @return {Object} this
     */
    clear_cache() {
        // 调用缓存对象清空缓存
        new Key_cache({
            dir: this.options.cache_path
        }).remove();

        return this;
    }

    /**
     * 获取navtree使用数据，会追加options.links
     *
     * @description 会先读取缓存
     * @return {Array} 数组
     */
    get_list() {
        return this.cache('nav_data', () => {
            let data = this._get_list();

            if (!data.children) {
                data.children = [];
            }

            // 如果有链接，则追加
            if (this.options.links && this.options.links.length) {
                this.options.links.forEach(val => {
                    if (val.type === 'after') {
                        data.children.push(val);
                    }
                    else {
                        data.children.unshift(val);
                    }
                });
            }

            return data.children;
        });
    }

    /**
     * 渲染md文件
     *
     * @param  {string} content md源码
     *
     * @return {Object}         {content:html代码, catalog: h2,3分类}
     */
    render_markdown(content = '') {
        let renderer = new marked.Renderer();
        let cachekey = {};

        let catalog = [];

        // 渲染标题
        renderer.heading = (text, level) => {
            let key;

            // 如果不是h1,h2,h3则直接返回
            if ([1, 2, 3].indexOf(level) === -1) {
                return `<h${level}>${text}</h${level}>`;
            }

            if (cachekey[level] === undefined) {
                cachekey[level] = 0;
            }

            key = ++cachekey[level];

            // 使用text文本来写hash
            // 把text文本里的标签去掉
            let hash = String(text).replace(/<([^>]+?)>/g, '');

            catalog.push({
                text,
                level,
                id: `h${level}-${key}`,
                hash: hash
            });

            return `
                <h${level}>
                    <span>
                        <a name="${hash}" id="${hash}"></a>
                        <a name="h${level}-${key}" href="#h${level}-${key}"></a>
                        <span>${text}</span>
                    </span>
                </h${level}>
            `;
        };


        // 渲染代码
        renderer.code = (data, lang) => {
            let html;

            data = highlight.highlightAuto(data).value;

            // 有语言时
            if (lang) {

                // 超过3行有提示
                if (data.split(/\n/).length >= 3) {
                    html = `<pre><code class="hljs lang-${lang}" data-lang="${lang}">${data}</code></pre>`;
                }

                html = `<pre><code class="hljs lang-${lang}">${data}</code></pre>`;
            }
            else {
                html = `<pre><code class="hljs">${data}</code></pre>`;
            }

            return html;
        };

        // md => html
        content = marked(content, {
            renderer
        });

        // 兼容todo
        content = content.replace(/<li>\s*\[ \]\s*/g, '<li><input type="checkbox" class="ui-todo" disabled>');
        content = content.replace(/<li>\s*\[x\]\s*/g, '<li><input type="checkbox" disabled checked class="ui-todo">');

        return {
            content,
            catalog
        };
    }

    /**
     * 运行
     *
     * @return {Object} this
     */
    run() {
        // 委托目录浏览
        this.express.use('/', serve_index(this.options.root, {
            icons: true
        }));
        this.express.listen(this.options.port);
        return this;
    }

    /**
     * 缓存
     *
     * @description 如果有key的缓存则直接调用缓存，否则使用fn返回值作为缓存，如果开启了debug则直接使用fn返回值
     * @param  {string}   key  缓存key
     * @param {Function} fn 当没有缓存时执行的回调
     * @return {Object|undefined} 缓存数据或者回调返回值
     */
    cache(key, fn = () => {}) {
        // 如果没有key则返回空
        if (!key) {
            return undefined;
        }

        // 如果有debug
        if (this.options.debug) {
            return fn();
        }

        let cache = new Key_cache({
            dir: this.options.cache_path
        });
        let value = cache.get(key);
        if (value) {
            return value;
        }

        value = fn();

        // 如果不为空则设置缓存
        if (value !== undefined) {
            cache.set(key, value);
        }

        return value;
    }

    /**
     * 初始化express
     *
     * @private
     */
    _init_express() {
        let app = this.express;

        template.config('base', '');
        template.config('extname', '.html');

        app.engine('.html', template.__express);
        app.set('views', resolve(this.__dirname, './views/'));
        app.set('view engine', 'html');

        // 写入变量
        app.use((req, res, next) => {
            // 写入变量
            res.locals.options = this.options;

            return next();
        });

        // 绑定.md文档
        app.get(/([\s\S]+?)\.md$/, ::this._md);

        // 监听以目录结束的，其实是为了解决默认主页为md文档问题
        app.get(/(^\/$|\/$)/, (req, res, next) => {
            let parseUrl = parse(req.url, true);
            let pathname = parseUrl.pathname;

            // 相对文件的路径,用来判断文件是否存在
            let filepath = decodeURIComponent('.' + pathname);

            // 处理默认主页，拿配置的主页文件名去查找实际这个文件是否存在
            let flag = false;
            this.options.default_index.some(val => {
                if (existsSync(resolve(this.options.root, filepath, val))) {
                    flag = val;
                    return true;
                }
            });

            if (flag) {
                req.url = format({
                    hash: parseUrl.hash,
                    search: parseUrl.search,
                    pathname: pathname + flag,
                    query: parseUrl.query
                });

                return this._md(req, res, next);
            }

            next();
        });

        // 委托静态资源
        app.use('/' + this.options.static_prefix, serve_static(resolve(this.__dirname, './static/')));

        // 委托源目录
        app.use('/', serve_static(this.options.root));
    }

    /**
     * 内部获取列表数据
     *
     * @private
     * @param  {string|undefined} dir 目录
     *
     * @return {Object}     {path:'', children:[]}
     */
    _get_list(dir) {
        let options = this.options;
        let result;

        dir = dir || options.root;

        let file_basename = basename(dir);

        result = {
            id: dir.replace(options.root, '') || '/',
            children: [],
            text: options.dir_alias[file_basename] || file_basename
        };

        // 如果目录不存在
        if (!existsSync(dir)) {
            return result;
        }

        // 读取目录里数据
        let data = readdirSync(dir);

        // 定义目录数据和文件数据
        let dir_data = [];
        let file_data = [];

        // 遍历数据，拿出目录、文件的数据
        data.forEach(file => {
            let filepath = resolve(dir, file);
            let stat = statSync(filepath);

            if (stat.isDirectory()) {
                if (options.ignore_dir && options.ignore_dir.indexOf(file) === -1) {
                    dir_data.push({
                        type: 'dir',
                        filepath
                    });
                }
            }
            else {
                if (extname(file) === '.md') {
                    file_data.push({
                        filepath
                    });
                }
            }
        });

        // 合并目录+文件数据
        dir_data.concat(file_data).forEach(file => {
            if (file.type === 'dir') {
                let res = this._get_list(file.filepath);

                // 必须有子集才算
                if (res.children && res.children.length) {
                    result.children.push(res);
                }
            }
            else {
                result.children.push({
                    text: this.get_markdown_title(file.filepath),
                    id: file.filepath.replace(options.root, '').split(sep).join('\/')
                });
            }
        });

        return result;
    }

    /**
     * 渲染md文档
     *
     * @private
     * @param  {Object}   req  express.req
     * @param  {Object}   res  express.res
     * @param  {Function} next 下一个路由
     * @return {Object} res
     */
    _md(req, res, next) {
        let parseUrl = parse(req.url, true);

        // 如果要读取源码
        if (parseUrl.query.source) {
            return next();
        }

        // 加.是为了变成相对路径
        let filepath = resolve(this.options.root, '.' + parseUrl.pathname);

        // 为了中文
        filepath = decodeURIComponent(filepath);

        // 如果md文件不存在
        if (!existsSync(filepath)) {
            return next();
        }

        let markdown_data = this.render_markdown(readFileSync(filepath).toString()).content;

        // 如果是pjax
        if (parseUrl.query.pjax) {
            return res.end(markdown_data);
        }

        // 渲染md
        return res.render('markdown', {
            nav_data: JSON.stringify(this.get_render_nav(parseUrl.pathname)),
            markdown_data,
            title: `${this.get_markdown_title(filepath)} - ${this.options.name}`
        });
    }

    /**
     * 获取md文档的标题
     *
     * @param  {string} filepath 文件路径
     *
     * @return {string}     标题
     */
    get_markdown_title(filepath) {
        // 如果是md扩展
        if (extname(filepath) === '.md') {
            // 获取文件内容
            let filedata = readFileSync(filepath).toString();

            // 正则取出#标题的文字
            if (filedata.match(/^\s*\#+\s?(.+)/)) {
                return String(RegExp.$1).trim();
            }
        }

        return basename(filepath);
    }
}
