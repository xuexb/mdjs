/**
 * @file 页面js
 * @author fe.xiaowu@gmail.com
 */

$(function () {
    var $nav = $('#nav');
    $nav.on('click', 'a.nav-tree-dir-a', function () {
        $(this).parent().parent().toggleClass('nav-tree-dir-open');
        return false;
    });

    $nav.on('click current', 'a.nav-tree-file-a', function () {
        $nav.find('.nav-tree-current').removeClass('nav-tree-current');
        $(this).parent().parent().addClass('nav-tree-current');
    });
    $nav.on('open', 'a', function () {
        var $elem = $(this);

        $elem.trigger('current');

        $elem = $elem.parents('.nav-tree-dir');

        while ($elem.length) {
            $elem.addClass('nav-tree-dir-open');
            $elem = $elem.parents('.nav-tree-dir');
        }
    });

    $.pjax({
        selector: 'a[href$=".md"]',
        container: '#content .markdown-body', // 内容替换的容器
        show: '', // 展现的动画，支持默认和fade, 可以自定义动画方式，这里为自定义的function即可。
        cache: false, // 是否使用缓存
        storage: false, // 是否使用本地存储
        titleSuffix: ' - ' + window.options.name, // 标题后缀
        filter: function () {},
        callback: function () {
            var url = location.href.replace(location.origin, '');

            $('a[data-uri="' + url + '"]').trigger('open');

            $(window).trigger('resize');
        }
    });

    $('#content .markdown-body').on('pjax.start', function (event) {
        $('#content').addClass('loading');
    });

    $('#content .markdown-body').on('pjax.end', function (event) {
        $('#content').removeClass('loading');
    });

    (function (fn) {
        if (window.requestAnimationFrame) {
            fn();
        }

    })(function () {
        var $w = $(window);
        var $prog2 = $('.progress-indicator-2');
        var wh = $w.height();
        var h = $('body').height();
        var sHeight = h - wh;

        $w.on('resize', function () {
            wh = $w.height();
            h = $('body').height();
            sHeight = h - wh;
        });

        $w.on('scroll', function () {
            window.requestAnimationFrame(function () {
                var perc = Math.max(0, Math.min(1, $w.scrollTop() / sHeight));
                updateProgress(perc);
            });
        });

        function updateProgress(perc) {
            $prog2.css({
                width: perc * 100 + '%'
            });
        }
    });

    // 支持mini版
    $('#nav-mini').on('click', function () {
        $('#nav').toggleClass('nav-show');
    });
    $('#nav').on('click', '.nav-tree-file-a', function () {
        if ($('#nav-mini').is(':visible')) {
            $('#nav').removeClass('nav-show');
        }

    });
});


// test
var substringMatcher = function (arr) {
    return function findMatches(q, cb) {
        var matches;
        var substringRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');
        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(arr, function (i, val) {
            if (substrRegex.test(val.text)) {
                matches.push(val.text);
            }

        });

        cb(matches);
    };
};

var states = $('#nav-tree a.nav-tree-file-a').map(function () {
    return {
        text: this.title,
        uri: this.getAttribute('data-uri')
    };
});

$('#J-search').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
}, {
    limit: 10,
    name: 'states',
    source: substringMatcher(states)
}).on('keydown', function (event, data) {
    if (event.keyCode === 13 || data === true) {
        try {
            var $elem = $('#nav-tree a[title="' + this.value + '"]');
            if ($elem.length) {
                $elem.trigger('click');
                $(this).typeahead('close');
            }
            else if(this.value) {
                // location.href = '/search/?key=' + this.value;
            }
        }
        catch (e) {
            // location.href = '/search/?key=' + this.value;
        }
    }

});

$('.nav-search').on('click', '.tt-suggestion', function () {
    setTimeout(function () {
        $('#J-search').trigger('keydown', true);
    }, 100);
});
