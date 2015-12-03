'use strict';

var Mdjs = require('./');

new Mdjs({
    static_prefix: 'test',
    debug: true
}).clear_cache().run();