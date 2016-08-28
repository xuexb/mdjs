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

    $('#nav-flag').on('click', function () {
        $('body').toggleClass('nav-hide');
        this.title = this.title === '点击收起' ? '点击展开' : '点击收起';
    });
});
