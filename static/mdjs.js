/**
 * @file mdjs.js
 * @author xiaowu
 */

(function () {
    var nav_data = window.nav_data || [];
    var SEARCH_DATA = (function () {
        var arr = [];
        var fn = function (data) {
            data.forEach(function (val) {
                if (!val.children || !val.children.length) {
                    arr.push(val);
                }
                else {
                    fn(val.children);
                }
            });
        };
        fn(nav_data);

        return arr;
    })();

    $('.md-body-left-tools span').on('click', function () {
        $('.md-wrap').attr('data-open', function () {
            return $(this).attr('data-open') === 'true' ? false : true;
        });
    });

    var hideTime = null;
    $('.md-body-tab-search-form input').on('input propertychange', function () {
        var value = $.trim($(this).val());
        if (!value) {
            return hideSearchDown();
        }

        showSearchDown(value);
    }).on('blur', function () {
        hideTime = setTimeout(function () {
            hideSearchDown();
        }, 100);
    }).on('foucs', function () {
        clearTimeout(hideTime);
    });

    function showSearchDown(key) {
        var html = '';
        var arr = getSearch(key);

        if (!arr.length) {
            return;
        }

        arr.forEach(function (val) {
            console.log(val.text, typeof val.text, key)
            var text = val.text.replace(new RegExp(key, 'gi'), function ($0) {
                return '<mark>' + $0 + '</mark>';
            });
            html += [
                '<li data-id="' + val.id + '">',
                    '<p>' + text + '</p>',
                '</li>'
            ].join('');
        });

        $('.md-body-search-down').html('<ul>' + html + '</ul>').show();
    }
    function hideSearchDown() {
        $('.md-body-search-down').empty().hide();
    }
    function getSearch(value) {
        var arr = [];
        $.each(SEARCH_DATA, function (index, val) {
            if (arr.length > 9) {
                return false;
            }
            if (val.text.indexOf(value) > -1 || val.uri.indexOf(value) > -1) {
                arr.push(val);
            }
        });

        return arr;
    }
    $('.md-body-search-down').on('click', 'li', function () {
        pushState($(this).data('id'));
        hideSearchDown();
        $('.md-body-tab-search-form input').val('');

        var instance = $('#nav').jstree(true);
        instance.deselect_all();
        instance.select_node(decodeURIComponent($(this).data('id')));
    });

    $('#nav').jstree({
        core: {
            'data': nav_data
        }
    });

    $('#nav').on('changed.jstree', function (e, data) {
        // 如果不是用户触发的，这里是回退触发
        if (data.action === 'select_node' && !data.event) {
            // var top = 
            // $('.md-body-tab-dir-tree').animte();
            return;
        }
        if (!data.selected || !data.selected[0] || data.selected[0].indexOf('.md') === -1) {
            return;
        }

        pushState(data.selected[0]);
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
