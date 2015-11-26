'use strict';

var Mdocjs = require('./');

new Mdocjs({
    static_prefix: 'test',
    debug: true
}).clear_cache().run();