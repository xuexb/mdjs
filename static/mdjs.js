/**
 * @file mdjs.js
 * @author xiaowu
 */

(function () {
    $('.md-body-left-tools span').on('click', function () {
        $('.md-wrap').attr('data-open', function () {
            return $(this).attr('data-open') === 'true' ? false : true;
        });
    });

    $('#nav').jstree({
        core: {
            'data': window.nav_data
        }
    });

    $('#nav').on('changed.jstree', function (e, data) {
        var url;

        // 如果不是用户触发的，这里是回退触发
        if (!data.event) {
            return;
        }
        if (!data.selected || !data.selected[0] || data.selected[0].indexOf('.md') === -1) {
            return;
        }

        url = data.selected[0];

        pushState(url);
    });

    $(window).on('popstate', function () {
        var url = location.pathname + location.search;
        render(url);

        var instance = $('#nav').jstree(true);
        instance.deselect_all();
        instance.select_node(decodeURIComponent(url));
    });

    function pushState(url, state) {
        history.pushState(state || {}, null, url);

        render(url);
    }

    var xhr = null;
    function render(url) {
        if (xhr) {
            xhr.abort();
        }
        $.ajax({
            url: url,
            dataType: 'text',
            data: {
                pjax: 1
            },
            success: function (html) {
                $('.markdown-body').html(html);
            },
            error: function (XHR, status) {
                if (XHR && status !== 'abort') {
                    $('.markdown-body').html('加载出错了~');
                }
            },
            complete: function () {
                xhr = null;
            }
        });
    }
})();
