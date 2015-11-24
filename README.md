# mdjs

一个纯洁的`md`文档在线浏览

## 功能

- [x] 目录导航自动抓取（递归抓取`options.root`目录下包含`.md`文件的非空目录）
- [x] `md`文件的导航文件名使用文件内第1个标题
- [x] 导航里目录支持别名`options.dir_alias`
- [x] 导航里追加自定义的链接`options.links`
- [x] 自定义勾子`express.get`
- [ ] 自制主题（其实感觉也没必要）

## 安装

```bash
npm install mdjs --save
```

## 启动

```js
var Mdjs = require('mdjs');

var app = new Mdjs(options);
```

## 配置

### json配置

可以`启动目录`里创建`package.json`，内容如：

```json
{
    "mdjs": {
    }
}
```

### js配置

```js
'use strict';

var Mdocjs = require('mdjs');

new Mdocjs({});
```

### 默认配置

```js
{
    /**
     * 文档名
     *
     * @type {String}
     */
    name: 'mdjs',

    /**
     * 监听的端口
     *
     * @type {Number}
     */
    port: 8091,

    /**
     * 文档根目录
     *
     * @type {String}
     */
    root: './',

    /**
     * 缓存文件目录
     *
     * @type {String}
     */
    cache_path: './.cache/',

    /**
     * 目录别名
     *
     * @type {Object}
     */
    dir_alias: {},

    /**
     * mdjs静态资源前缀
     *
     * @description 监听内置的静态资源，配置是为了解决与别的名冲突
     * @type {String}
     */
    static_prefix: 'static',

    /**
     * 忽略的目录
     *
     * @type {Array}
     */
    ignore_dir: [
        '.svn',
        '.git',
        'node_modules'
    ],

    /**
     * 导航里额外追加的链接
     *
     * @example
     *     [
     *         {
     *             "text": "链接名称-默认往导航之前插件",
     *             "url": "链接"
     *         },
     *         {
     *             "text": "链接名称-往导航之后追加",
     *             "url": "链接",
     *             "type": "after"
     *         }
     *     ]
     * @type {Array}
     */
    links: [
    ]
}
```

### 配置顺序

`默认配置 -> json配置 -> js初始化配置`

> 后者会覆盖前者

## 接口

为了可扩展些小功能，扩展了以下实例接口：

```js
/**
 * 获取渲染后的导航html代码
 *
 * @param  {string|undefined} uri 当前高亮的路径，如果为空则全不高亮， 高亮即展开
 *
 * @return {string}     html代码
 */
get_render_nav(uri) {}

/**
 * 清空缓存
 *
 * @return {Object} this
 */
clear_cache() {}

/**
 * 获取navtree使用数据，会追加options.links
 *
 * @description 会先读取缓存
 * @return {Array} 数组
 */
get_list() {}

 /**
 * 渲染md文件
 *
 * @param  {string} content md源码
 *
 * @return {Object}         {content:html代码, catalog: h2,3分类}
 */
renderMarkdown(content = '') {}
```

### express

可使用`app.express`来获取`express`对象，如：

```js
var app = new Mdjs();

var express = app.express;

// 监听/update接口
express.get('/update', function (req, res, next) {
    // 清空缓存
    app.clear_cache();

    res.json({
        status: 'ok',
        msg: '我是勾子'
    });
});
```

## nginx代理

推荐使用`nginx`代码静态文件，比如文档内有大量`html, css, js`文件，可先通过`nginx`代理访问，当文件不存在时（`mdjs`内置资源就不在文档内存在）、`.md`文件结束时代码到`node`层面，达到优化的功能，更可以解决`hostname`问题

`node`监听`8088`端口

```js
// index.js
'use strict';

var Mdocjs = require('mdjs');

new Mdocjs({
    port: 8088
});
```

`nginx`监听`80`并绑定`hostname`

```conf
server {
    listen       80;
    server_name www.demo.com;

    # node的端口
    set $node_port 8088;

    # 根目录
    root /home/demo/;

    # 保护index.js源
    location = /index.js {
        return 403;
    }

    # 如果文件不存在代理到node.js上
    if ( !-f $request_filename ){
        rewrite (.*) /node.js;
    }

    # 代理所有的md代理到node.js上
    location ~ \.md$ {
        rewrite (.*) /node.js;
    }

    # 监听node.js并转发
    location = /node.js {
        #proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://127.0.0.1:$node_port$request_uri;
        proxy_redirect off;
    }
}
```