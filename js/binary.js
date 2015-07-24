if (window.applicationCache) {
        window.applicationCache.addEventListener('updateready', function(){
            if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
                try {
                    window.applicationCache.swapCache();
                    var appcache_reload_message = $('#appcache-reload-message');
                    appcache_reload_message.css('display', 'block');
                    appcache_reload_message.on('click', '#appcache-refresh-link', function () {
                        window.location.reload();
                        return false;
                    });
                } catch (err) {}
            }
        }, false);

        setInterval(function () {
                try {
                    window.applicationCache.update();
                } catch (err) {}
        }, 5*60*1000);
}
;/**
 * Synopsis
 *
 * var p = new InPagePopup({content: 'popup content'});
 * p.attach('button.open-popup');
 * // and now $('button.open-popup').get(0).inpage_poup is a reference to p
 *
 */
var InPagePopup = function(conf) {
    if (!conf) conf = {};
    if (typeof conf != 'object') {
        conf = {content: conf};
    }
    this.element = null;
    this._container = null;
    this.width = conf.width || null;
    this.close_on_escape = typeof conf.close_on_escape == 'undefined' ? true : conf.close_on_escape;
    this.drag_handle = conf.drag_handle || '.drag-handle';
    this.ajax_conf = conf.ajax_conf || null;
    this._content = conf.content || '';
};

/**
 * Update the configuations of the pipup, change the width,
 * set draggable or not, etc.
 */
InPagePopup.prototype.config = function(conf) {
    if (conf.width) this.width = conf.width;
    if (typeof conf.close_on_escape != 'undefined') this.close_on_escape = !!conf.close_on_escape;
    if (conf.drag_handle) this.drag_handle = conf.drag_handle;
    if (conf.ajax_conf) this.ajax_conf = conf.ajax_conf;
};

/**
 * Get or set the contens of the popup.
 *
 * @param new_content: set the new content
 */
InPagePopup.prototype.content = function(new_content) {
    var me = this;
    if (typeof new_content == 'undefined') {
        if (this._container) {
            return $('.inpage_popup_content', me._container).html();
        }
        return this._content;
    }
    if (this._container) {
        $('.inpage_popup_content', me._container).html(_new_content);
    } else {
        this._content = new_content;
    }
    return this;
};

/**
 * Finds the contents of the popup from the specified element.
 */
InPagePopup.prototype.find_element_popup_content = function(element) {
    if (!element) throw new Error("failed to detect element contents. no element specified");
    var jqel = $(element);
    var num = jqel.length;
    for (i = 0; i < num; i++) {
        var el = jqel.get(i);
        var elid = $(el).attr('id');
        if (elid) {
            var content_id = elid + '-content';
            var contents = $('.inpage_popup_content#' + content_id);
            if (contents.length) {
                return contents.first();
            }
        }
    }
    return null;
};

InPagePopup.prototype._ajax_request = function(callback, errback) {
    conf = {};
    if (this.ajax_conf) conf = (typeof this.ajax_conf == 'function') ? this.ajax_conf() : this.ajax_conf;
    if (typeof conf != 'object') conf = {url : conf};
    if (callback) conf.success = callback;
    if (errback) conf.error = errback;
    $.ajax(conf);
    return this;
};

/**
 * fetch contents of the inpage popup via AJAX.
 * Paramters passed to callbacks are standard jQuery params, with the popup object itself in the end.
 *
 * @param show: show the popup after data is fetched or not.
 * @param before_show: callback to be called before showing the popup. used for processing server response.
 *                     If this method returns a string it is considered as the new contents of the popup.
 *                     If it returns false or throws an error, the popup is not going to be shown.
 * @param after_show: callback to be called after showing the popup.
 * @param errback: errback to be called when errors occurred fetching data
 */
InPagePopup.prototype.fetch_remote_content = function(show, before_show, after_show, errback) {
    var me = this;
    if (!errback) {
        errback = function(jqxhr, txt_status, err) {
            throw new Error("Failed to fetch contents of the popup: " + err);
        };
    }
    var run_callbacks = function (data, txt_status, jqxhr) {
        if (before_show) {
            data = before_show(data, txt_status, jqxhr, me);
            if (!data) return false;
        }
        me.content(data);
        if (show !== false) me.show();
        if (after_show) after_show(data, txt_status, jqxhr, me);
    };
    this._ajax_request(run_callbacks, errback);
    return this;
};

/**
 * Initialize the container, set the contents and return it.
 */
InPagePopup.prototype._init_container = function() {
    this.close();
    var me = this;
    var container = $('<div class="inpage_popup_container"><a class="close">x</a></div>');
    var content = this.element ? this.find_element_popup_content(this.element) : null;
    var jq_content = content ? content.clone() : null;
    if (!jq_content) jq_content = $('<div class="inpage_popup_content">' + this._content + '</div>');
    container.append(jq_content);
    container.hide();
    jq_content.show().removeClass('invisible');
    $(document.body).append(container);
    if (me.width) container.width(me.width);
    this._container = container;
    container.find('.close').on('click', function() { me.close(); });
    if (this.close_on_escape) {
        $(document).on('keydown', function(e) {
            if (e.which == 27) me.close();
        });
    }
    this.reposition();
    return container;
};

/**
 * Reposition the popup on the screen. by default uses the center of the screen.
 */
InPagePopup.prototype.reposition = function(x, y) {
    if (this._container) {
        var win_ = $(window);
        var container = this._container;
        if (typeof x == 'undefined') {
            x = Math.max(Math.floor((win_.width() - container.width()) / 2), 50) + win_.scrollLeft();
        }
        if (typeof y == 'undefined') {
            y = Math.max(Math.floor((win_.height() - container.height()) / 2), 50) + win_.scrollTop();
        }
        this._container.offset({left: x, top: y});
    }
    return this;
};

/**
 * Return the container of the popup.
 */
InPagePopup.prototype.container = function() {
    if (!this._container) this._init_container();
    return this._container;
};

InPagePopup.prototype.show = function() {
    this.container().show();
    return this;
};

InPagePopup.prototype.close = function() {
    if (this._container) {
        this._container.hide().remove();
    }
    this._container = null;
    return this;
};

/**
 * Attaches the inpage popup to the specified element.
 *
 * each element would have a new property of 'inpage_popup' which
 * will reference to this same popup.
 *
 * @param element: any jQuery selector, or DOM or jquery object
 */
InPagePopup.prototype.attach = function(element) {
    var me = this;
    this.detach();
    var jqel = $(element);
    if (!jqel.length) {
        throw new Error("Failed to attach inpage popup. no such element exists for: " + element);
    }
    this.element = jqel;
    this.element.on('click', function(e) { e.preventDefault(); me.show(); });
    jqel.each( function () { this.inpage_popup = me; });
    return this;
};

/**
 * Detach the popup from element.
 */
InPagePopup.prototype.detach = function() {
    var me = this;
    if (this.element) {
        this.element.off('click');
        this.element.each( function () { this.inpage_popup = null; } );
    }
    this.element = null;
    return this;
};
;var Markets = function(markets, market_symbols) { 
    this.all = [];
    var market_count = markets.length;
    while(market_count--) {
        var market_name = markets[market_count];
        var market_config = market_symbols[market_name];
        var market_obj = new Market(market_name, market_config['label'], market_config['submarkets']);
        this.all.push(market_obj);

    }
};

Markets.prototype = {
    each: function(callback) {
        var market_count = this.all.length;
        while(market_count--) {
            callback.call(this.all[market_count]);
        }
    },
    by_symbol: function(symbol) {
        var market_count = this.all.length;
        while(market_count--) {
            var found = this.all[market_count].by_symbol(symbol);
            if(found) {
                return found;
            }
        }
    },
    get: function(name) {
        var market_count = this.all.length;
        while(market_count--) {
            if(this.all[market_count].name == name) {
                return this.all[market_count];
            }
        }
    }
};

var Market = function(name, display_name, submarkets) {
    this.name = name;
    this.display_name = display_name;
    this.submarkets = [];
    this.all_submarkets = [];
    var submarket_count = submarkets.length;
    while(submarket_count--) {
        var submarket = submarkets[submarket_count];
        var submarket_obj = new SubMarket(submarket['name'], submarket['label'], submarket['instruments']);
        this.submarkets.push(submarket_obj);
        this.all_submarkets.push(submarket_obj);
    }
};

Market.prototype = {
    translated_display_name: function() {
        return text.localize(this.display_name);
    },
    by_symbol: function(symbol) {
        var count = this.submarkets.length;
        while(count--) {
            found = this.submarkets[count].by_symbol(symbol);
            if(found) {
                found['market'] = this;
                return found;
            }
        }
    },
    each: function(callback) {
        var count = this.all_submarkets.length;
        while(count--) {
            callback.call(this.all_submarkets[count]);
        }
    },
    get: function(name) {
        if(name.toUpperCase() == 'ALL') {
            return this.all_submarkets;
        }

        var count = this.submarkets.length;
        while(count--) {
            if(this.submarkets[count].name == name) {
                return this.submarkets[count];
            }
        }
    }
};

function localizeName() {
    return text.localize(this.name);
}

var SubMarket = function(name, display_name, underlyings) {
    this.name = name;
    this.display_name = display_name;
    this.underlyings = [];
    var underlying_count = underlyings.length;
    while(underlying_count--) {
        var underlying = underlyings[underlying_count];
        var underlying_object = {
            name: underlying['label'],
            symbol: underlying['value'],
            translated_display_name: localizeName
        };
        this.underlyings.push(underlying_object);
    }
};

SubMarket.prototype = {
    translated_display_name: function() {
        return text.localize(this.display_name);
    },
    each: function(callback) {
        var underlying_count = this.underlyings.length;
        while(underlying_count--) {
            callback.call(this.underlyings[underlying_count]);
        }
    },
    by_symbol: function(symbol) {
        var underlying_count = this.underlyings.length;
        while(underlying_count--) {
            if(this.underlyings[underlying_count].symbol == symbol) {
                return { submarket: this, underlying: this.underlyings[underlying_count] };
            }
        }

        return;
    },
};
;var MenuContent = (function () {
    var listeners_events = [];

    var that = {
        init: function (_menu_containers) {
            _menu_containers.filter(':not(.follow-default)').delegate('.tm-a,.tm-a-2', 'click', function (event) {
                event.preventDefault();

                var target = $(event.target);
                var tab_id = target.parents('li:first').attr('id');

                if (tab_id)
                {
                    var tab_container = target.parents('.tm-ul');

                    var selected_tab =
                        // find previously active tab
                        tab_container.find('.tm-a,.tm-a-2')
                        // remove previously active tab
                        .removeClass('a-active').end()
                        // unwrap previously active tab
                        .find('.menu-wrap-a .tm-a').unwrap().unwrap()
                        // go back to selected target
                        .end().end()
                        // set active class to it
                        .addClass('a-active')
                        // set active class to its parent as well
                        .parents('.tm-li').addClass('active').removeClass('hover').find('.tm-li-2').addClass('active').end()
                        // wrap it
                        .find('.tm-a').wrap('<span class="menu-wrap-a"><span class="menu-wrap-b"></span></span>').end()
                        // remove previously active parent
                        .siblings().removeClass('active').find('.tm-li-2').removeClass('active').end()
                        .end().end();

                    // replace span to a, to make it clickable for real
                    var span_tm_a = tab_container.find('span.tm-a');
                    span_tm_a.replaceWith('<a href="#" class="'+span_tm_a.attr('class')+'">'+span_tm_a.html()+'</a>');

                    var menu_li = selected_tab.parents('li');
                    var sub_menu_selected = menu_li.find('.tm-ul-2 .a-active');
                    var selected_tab_id = menu_li.attr('id');

                    if (!sub_menu_selected.length)
                    {
                        sub_menu_selected = menu_li.find('.tm-a-2:first').addClass('a-active');

                        if (sub_menu_selected.length)
                        {
                            selected_tab = sub_menu_selected;
                            selected_tab_id = sub_menu_selected.parents('li').attr('id');
                            selected_content = $('#'+selected_tab_id+'-content').removeClass('invisible');
                        }
                        else
                        {
                            selected_tab_id = menu_li.attr('id');
                        }
                    }

                    var selected_content = $('#'+selected_tab_id+'-content')
                        // show selected tab content
                        .removeClass('invisible')
                        // and hide the rest
                        .siblings(':not(.sticky)').addClass('invisible').end();

                    that.push_to_listeners({
                        'id': selected_tab_id,
                        'target': selected_tab,
                        'content': selected_content,
                        'menu': menu_li.parents('ul.tm-ul'),
                        'event': event
                    });
                }

                return false;
            });
        },
        push_to_listeners: function (info)
        {
            // push to listeners events
            for (var i=0; i<listeners_events.length; i++)
            {
                listeners_events[i](info);
            }
        },
        listen_click: function (callback)
        {
            if (typeof callback != 'function')
            {
                return false;
            }

            listeners_events.push(callback);
        },
        find_selected_tab: function (menu_id)
        {
            var menu = $('#'+menu_id);
            var selected_tab = menu.find('.a-active').parents('.tm-li');

            if (!selected_tab.length)
            {
                selected_tab = menu.find('.active');
            }

            return selected_tab;
        },
        is_tab_selected: function (tab)
        {
            return tab.hasClass('active');
        },
        hide_tab: function (tab)
        {
            tab.addClass('invisible').find('.menu-wrap-a .tm-a').unwrap().unwrap();
            $('#'+tab.attr('id')+'-content').addClass('invisible');
        },
        show_tab: function (tab)
        {
            tab.removeClass('invisible');
        },
        trigger: function (id)
        {
            var tab_id = id['tab_id'];
            var content_id = id['content_id'];

            if (!tab_id && typeof content_id != 'undefined') {
                var matched = content_id.match(/^(.+)-content$/);
                if (matched && matched[1]) {
                    tab_id = matched[1];
                }
            }

            if (!tab_id)
            {
                return false;
            }

            var tab_to_trigger = $('#'+tab_id);

            if (!tab_to_trigger.size() || tab_to_trigger.hasClass('invisible'))
            {
                return false;
            }
            else
            {
                var tab = tab_to_trigger.find('.tm-a');
                if (tab.size())
                {
                    return tab.trigger('click');
                }
                else
                {
                    return tab_to_trigger.find('.tm-a-2').trigger('click');
                }
            }
        }
    };

    return that;
})();
;(function () {
    'use strict';

    var oldOnError = window.onerror;
    window.jsErrors = [];

    window.onerror = function (errorMessage, url, line) {

        window.jsErrors.push(errorMessage); // todo: refactor to Binary.jsErrors later
        
        if (oldOnError) {
            oldOnError(errorMessage, url, line);
        }
    };
})();
;var text;

var gtm_data_layer_info = function() {
    var gtm_data_layer_info = [];
    $('.gtm_data_layer').each(function() {
        var gtm_params = {};
        var event_name = '';
        $(this).children().each(function() {
            var tag = $(this).attr("id");
            var value = $(this).html();

            if ($(this).attr("data-type") == "json") {
                value = JSON.parse($(this).html());
            }

            if (tag == "event") {
                event_name = value;
            } else {
                gtm_params[tag] = value;
            }
        });
        gtm_params['url'] = document.URL;

        var entry = {};
        entry['params'] = gtm_params;
        entry['event'] = event_name;
        gtm_data_layer_info.push(entry);
    });

    return gtm_data_layer_info;
};

var User = function() {
    this.email =  $.cookie('email');
    var loginid_list = $.cookie('loginid_list');

    if(this.email === null || typeof this.email === "undefined") {
        this.is_logged_in = false;
    } else {
        this.is_logged_in = true;

        if(loginid_list !== null && typeof loginid_list !== "undefined") {
            var loginid_array = [];
            var loginids = loginid_list.split('+').sort();

            for (var i = 0; i < loginids.length; i++) {
                var real = false;
                var disabled = false;
                var items = loginids[i].split(':');
                if (items[1] == 'R') {
                    real = true;
                }
                if (items[2] == 'D') {
                    disabled = true;
                }

                var id_obj = { 'id':items[0], 'real':real, 'disabled':disabled };
                if (/MLT/.test(items[0])) {
                    id_obj['non_financial']= true;
                }
                if (/MF/.test(items[0])) {
                    id_obj['financial']= true;
                }
                loginid_array.push(id_obj);
            }

            this.loginid_array = loginid_array;
        }
    }
};

var Client = function() {
    this.loginid =  $.cookie('loginid');
    this.is_logged_in = false;
    this.is_real = false;
    if(this.loginid === null || typeof this.loginid === "undefined") {
        this.type = 'logged_out';
    } else if(/VRT/.test(this.loginid)) {
        this.type = 'virtual';
        this.is_logged_in = true;
    } else {
        this.type = 'real';
        this.is_logged_in = true;
        this.is_real = true;
    }

    var dl_info = gtm_data_layer_info();
    if(dl_info.length > 0) {
        for (var i=0;i<dl_info.length;i++) {
            if(dl_info[i].event == 'log_in') {
                SessionStore.set('client_info', this.loginid + ':' + dl_info[i].params.bom_firstname + ':'  + dl_info[i].params.bom_lastname + ':' + dl_info[i].params.bom_email + ':' + dl_info[i].params.bom_phone);
            }
        }
    }

    var client_info = SessionStore.get('client_info');
    if(client_info) {
        var parsed = client_info.split(':');
        if(this.is_logged_in && parsed[0] == this.loginid) {
            this.first_name = parsed[1];
            this.last_name = parsed[2];
            this.name = this.first_name +  ' ' + this.last_name;
            this.email = parsed[3];
            this.phone = parsed[4];
        } else {
            SessionStore.remove('client_info');
        }
    }
};

var URL = function (url) { // jshint ignore:line
    this.is_valid = true;
    this.history_supported = window.history && window.history.pushState;
    if(typeof url !== 'undefined') {
        this.location = $('<a>', { href: decodeURIComponent(url) } )[0];
    } else {
        this.location = window.location;
    }
};

URL.prototype = {
    url_for: function(path, params, type) {
        var mid_path = '/';
        if(/.cgi/.test(path)) {
            if(type == 'cached') {
                mid_path = '/c/';
            } else {
                mid_path = '/d/';
            }
        }

        var url = "https://" + this.location.host + mid_path + path;
        if(params) {
            url += '?' + params;
            url += '&l=' + page.language();
        } else {
            url += '?l=' + page.language();
        }

        return url;
    },
    reset: function() {
        this.location = window.location;
        this._param_hash = undefined;
        this.is_valid = true;
        $(this).trigger("change", [ this ]);
    },
    invalidate: function() {
        this.is_valid = false;
    },
    update: function(url) {
        var state_info = { container: 'content', url: url, useClass: 'pjaxload' };
        if(this.history_supported) {
            history.pushState(state_info, '', url);
            this.reset();
        }
        this.is_valid = true;
    },
    param: function(name) {
        var param_hash= this.params_hash();
        return param_hash[name];
    },
    param_if_valid: function(name) {
        if(this.is_valid) {
           return this.param(name);
        }
        return;
    },
    path_matches: function(url) {
        //pathname is /d/page.cgi. Eliminate /d/ and /c/ from both urls.
        var this_pathname = this.location.pathname.replace(/\/[d|c]\//g, '');
        var url_pathname = url.location.pathname.replace(/\/[d|c]\//g, '');
        return (this_pathname == url_pathname || '/' + this_pathname == url_pathname);
    },
    params_hash_to_string: function(params) {
        var as_array = [];
        for(var p_key in params) if (params.hasOwnProperty(p_key)) {
            as_array.push(p_key + '=' + params[p_key]);
        }

        return as_array.join('&');
    },
    is_in: function(url) {
        if(this.path_matches(url)) {
            var this_params = this.params();
            var param_count = this_params.length;
            var match_count = 0;
            while(param_count--) {
                if(url.param(this_params[param_count][0]) == this_params[param_count][1]) {
                    match_count++;
                }
            }
            if(match_count == this_params.length) {
                return true;
            }
        }

        return false;
    },
    params_hash: function() {
        if(!this._param_hash) {
            this._param_hash = {};
            var params = this.params();
            var param = params.length;
            while(param--) {
                this._param_hash[params[param][0]] = params[param][1];
            }
        }
        return this._param_hash;
    },
    params: function() {
        var params = [];
        var parsed = this.location.search.substr(1).split('&');
        var p_l = parsed.length;
        while(p_l--) {
            var param = parsed[p_l].split('=');
            params.push(param);
        }
        return params;
    },
};

var Header = function(params) {
    this.user = params['user'];
    this.client = params['client'];
    this.settings = params['settings'];
    this.clock_started = false;
};

Header.prototype = {
    on_load: function() {
        this.show_or_hide_login_form();
        if (!this.clock_started) this.start_clock();
    },
    show_or_hide_login_form: function() {
        if (this.user.is_logged_in && this.client.is_logged_in) {
            var loginid_select = '';
            var loginid_array = this.user.loginid_array;
            for (var i=0;i<loginid_array.length;i++) {
                if (loginid_array[i].disabled) continue;

                var curr_loginid = loginid_array[i].id;
                var real = loginid_array[i].real;
                var selected = '';
                if (curr_loginid == this.client.loginid) {
                    selected = ' selected="selected" ';
                }

                var loginid_text;
                if (real) {
                    if(loginid_array[i].financial){
                        loginid_text = text.localize('Investment Account') + ' (' + curr_loginid + ')';
                    } else if(loginid_array[i].non_financial) {
                        loginid_text = text.localize('Gaming Account') + ' (' + curr_loginid + ')';
                    } else {
                        loginid_text = text.localize('Real Account') + ' (' + curr_loginid + ')';
                    }
                } else {
                    loginid_text = text.localize('Virtual Account') + ' (' + curr_loginid + ')';
                }

                loginid_select += '<option value="' + curr_loginid + '" ' + selected + '>' + loginid_text +  '</option>';
            }
            $("#client_loginid").html(loginid_select);
        }
    },
    register_dynamic_links: function() {
        var logged_in_url = page.url.url_for('');
        if(this.client.is_logged_in) {
            logged_in_url = page.url.url_for('user/my_account');
        }
    },
    start_clock: function() {
        var clock = $('#gmt-clock');
        if (clock.length === 0) {
            return;
        }

        var that = this;
        var clock_handle;
        var sync = function() {
            var query_start_time = (new Date().getTime());
            $.ajax({crossDomain: true, url: page.url.url_for('timestamp'), async: true, dataType: "json"}).done(function(response) {
                var start_timestamp = response.timestamp;

                //time now is timestamp from server + ping time.
                //ping time = roundtrip time / 2
                //roundtrip time = time at start of request - time after response.
                that.time_now = (start_timestamp * 1000) + (((new Date().getTime()) - query_start_time)/2);
                var increase_time_by = function(interval) {
                    that.time_now += interval;
                };

                var update_time = function() {
                    clock.html(moment(that.time_now).utc().format("YYYY-MM-DD HH:mm") + " GMT");
                };

                update_time();

                clearInterval(clock_handle);

                clock_handle = setInterval(function() {
                    increase_time_by(1000);
                    update_time();
                }, 1000);
            });
        };

        sync();
        setInterval(function() {
            sync();
        }, 900000);

        this.clock_started = true;
        return;
    },
};

var ToolTip = function() {
    this.tooltip = $('#tooltip');

    if (this.tooltip.length === 0) {
        this.tooltip = $('<div id="tooltip"></div>');
        this.tooltip.css('display', 'none')
            .appendTo('body');
    }

    this.showing = {};
    var that = this;
    $(window).resize(function() { that.resize_tooltip(); });
};

ToolTip.prototype = {
    attach: function() {
        var that = this;
        this.detach();

        var targets = $( '[rel~=tooltip]' ),
            target  = false,
            tip     = false,
            title   = false;

        targets.on('mouseenter', function(e) {
            tip = $(this).attr( 'title' );

            if( !tip || tip === '' )
                return false;

            that.showing.target = $(this);
            that.showing.tip = tip;

            that.showing.target.removeAttr( 'title' );

            that.tooltip.html(tip);
            that.resize_tooltip();
            that.reposition_tooltip_for(that.showing.target);
            that.show_tooltip($(this));
        });

        targets.on('mouseleave', function() {
            if(that.showing.target) {
                that.showing.target.attr( 'title', that.showing.tip );
            }
            that.hide_tooltip();
        });

        targets.on('click', function() {
            if(that.showing.target) {
                that.showing.target.attr( 'title', that.showing.tip );
            }
            that.hide_tooltip();
        });
    },
    detach: function() {
        $( '[rel~=tooltip]' ).off('mouseenter');
        $( '[rel~=tooltip]' ).off('mouseleave');
        this.tooltip.off('click');
    },
    show_tooltip: function(target) {
        this.tooltip.css({ display: ''});
        this.tooltip.zIndex(target.zIndex() + 100);
    },
    hide_tooltip: function(tooltip) {
        this.tooltip.html("");
        this.tooltip.css({ top: 0, left: 0, display: 'none'});
        this.tooltip.addClass('invisible');
    },
    resize_tooltip: function() {
        if( $( window ).width() < this.tooltip.outerWidth() * 1.5 )
            this.tooltip.css( 'max-width', $( window ).width() / 2 );
        else
            this.tooltip.css( 'max-width', 340 );
    },
    reposition_tooltip_for: function(target) {
        this.tooltip.removeClass('invisible');

        var pos_left = target.offset().left + ( target.outerWidth() / 2 ) - ( this.tooltip.outerWidth() / 2 ),
            pos_top = target.offset().top - (this.tooltip.outerHeight() + 10);

        this.tooltip.removeClass( 'left' );
        this.tooltip.removeClass( 'right' );
        this.tooltip.removeClass( 'top' );

        if( pos_left < 0 ) {
            pos_left = target.offset().left + target.outerWidth() / 2 - 20;
            this.tooltip.addClass( 'left' );
        }

        if( pos_left + this.tooltip.outerWidth() > $( window ).width() ) {
            pos_left = target.offset().left - this.tooltip.outerWidth() + target.outerWidth() / 2 + 20;
            this.tooltip.addClass( 'right' );
        }

        if( pos_top < 0 ) {
            pos_top  = target.offset().top + target.outerHeight() + 20;
            this.tooltip.addClass( 'top' );
        }

        this.tooltip.css( { left: pos_left, top: pos_top} );
    },
};

var Contents = function(client, user) {
    this.client = client;
    this.user = user;
    this.tooltip = new ToolTip();
};

Contents.prototype = {
    on_load: function() {
        this.activate_by_client_type();
        this.update_body_id();
        this.update_content_class();
        this.tooltip.attach();
    },
    on_unload: function() {
        this.tooltip.detach();
        if ($('.unbind_later').length > 0) {
            $('.unbind_later').off();
        }
    },
    has_real_account: function() {

        if (!this.user.is_logged_in) return false;

        for (var i = 0; i < this.user.loginid_array.length; i++) {
            if (this.user.loginid_array[i].real == 1) return true;
        }
        return false;
    },
    init_access_classes: function() {
        $('body')
            .removeClass()
            .toggleClass('client-logged-in', this.client.is_logged_in)
            .toggleClass('client-not-logged-in', !this.client.is_logged_in)
            .toggleClass('client-is-real', this.client.is_real)
            .toggleClass('client-is-virtual', this.client.is_virtual)
            .toggleClass('client-has-real', this.has_real_account())
            .toggleClass('client-1', !$.cookie('staff') || !/^Q?MF|MLT/.test(this.client.loginid))
            .toggleClass('client-2', !/^Q?CR/.test(this.client.loginid));
    },
    activate_by_client_type: function() {

        this.init_access_classes();

        $('.by_client_type').addClass('invisible');

        if (this.client.is_logged_in) {

            if(this.client.is_real) {
                $('.by_client_type.client_real').removeClass('invisible');
                $('.by_client_type.client_real').show();

                if (!/^Q?CR/.test(this.client.loginid)) {
                    $('#payment-agent-section').addClass('invisible');
                    $('#payment-agent-section').hide();
                }

                // temporary only show for internal staff
                if (!$.cookie('staff') || !/^Q?MF|MLT/.test(this.client.loginid)) {
                    $('#account-transfer-section').addClass('invisible');
                    $('#account-transfer-section').hide();
                }
            } else {
                $('.by_client_type.client_virtual').removeClass('invisible');
                $('.by_client_type.client_virtual').show();
            }
        } else {
            $('.by_client_type.client_logged_out').removeClass('invisible');
            $('.by_client_type.client_logged_out').show();
        }
    },
    update_body_id: function() {
        //This is required for our css to work.
        $('body').attr('id', '');
        $('body').attr('id', $('#body_id').html());
    },
    update_content_class: function() {
        var contentClass = $('#content_class').html();

        $('#content').parent()
            .removeClass()
            .addClass(contentClass);
    }
};

var Page = function(config) {
    config = typeof config !== 'undefined' ? config : {};
    this.user = new User();
    this.client = new Client();
    this.url = new URL();
    this.settings = new InScriptStore(config['settings']);
    this.header = new Header({ user: this.user, client: this.client, settings: this.settings, url: this.url});
    this.contents = new Contents(this.client, this.user);
};

Page.prototype = {
    language: function() {
        if(page.url.param('l')) {
            return page.url.param('l');
        } else {
            return 'EN';
        }
    },
    flag: function() {
        var idx = $('.language-options li a.selected').parent().index(),
            offset = - (idx + 1) * 15,
            cssStyle = '0 ' + offset + 'px';
        $('.nav-languages a').css('background-position', cssStyle);
    },
    on_load: function() {
        this.apply_pjax_class();
        this.url.reset();
        this.localize_for(this.language());
        this.header.on_load();
        this.flag();
        this.on_change_language();
        this.on_change_loginid();
        this.record_affiliate_exposure();
        this.contents.on_load();
        this.on_click_signup();
        this.on_input_password();
        this.on_click_acc_transfer();
        this.on_click_view_balances();
    },
    on_unload: function() {
        this.contents.on_unload();
    },
    apply_pjax_class: function() {
        var pjaxableLinks = $('a').filter(function() {
            return this.hostname == location.hostname;
        });
        pjaxableLinks.addClass('pjaxload');
    },
    on_change_language: function() {
        var that = this;
        $('.language-options').on('click', 'li', function(e) {
            var language = $(this).find('a').attr('data-langcode');
            document.location = that.url_for_language(language);
            e.preventDefault();
        });
    },
    on_change_loginid: function() {
        var that = this;
        $('#client_loginid').on('change', function() {
            $('#loginid-switch-form').submit();
        });
    },
    on_input_password: function() {
        $('#chooseapassword').on('input', function() {
            $('#reenter-password').removeClass('invisible');
            $('#reenter-password').show();
        });
    },
    on_click_signup: function() {
        $('#btn_registration').on('click', function() {
            var pwd = $('#chooseapassword').val();
            var pwd_2 = $('#chooseapassword_2').val();
            var email = $('#Email').val();

            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
                $('#signup_error').text(text.localize('Invalid email address'));
                $('#signup_error').removeClass('invisible');
                $('#signup_error').show();
                return false;
            }
            if (pwd.length === 0 || pwd_2.length === 0 || !client_form.compare_new_password(pwd, pwd_2)) {
                $('#signup_error').text(text.localize('The two passwords that you entered do not match.'));
                $('#signup_error').removeClass('invisible');
                $('#signup_error').show();
                return false;
            }
            // email != password
            if (email == pwd) {
                $('#signup_error').text(text.localize('Your password cannot be the same as your email'));
                $('#signup_error').removeClass('invisible');
                $('#signup_error').show();
                return false;
            }

            $('#virtual-acc-form').submit();
        });
    },
    on_click_acc_transfer: function() {
        $('#acc_transfer_submit').on('click', function() {
            var amount = $('#acc_transfer_amount').val();
            if (!/^[0-9]+\.?[0-9]{0,2}$/.test(amount) || amount < 0.1) {
                $('#invalid_amount').removeClass('invisible');
                $('#invalid_amount').show();
                return false;
            }
            $('#acc_transfer_submit').submit();
        });
    },
    on_click_view_balances: function() {
        $('#view-balances').on('click', function(event) {
            event.preventDefault();
            if ($(this).hasClass("disabled")) {
                return false;
            }
            $(this).addClass("disabled");

            $.ajax({
                url: page.url.url_for('user/balance'),
                dataType: 'text',
                success: function (data) {
                    var outer = $('#client-balances');
                    if (outer) outer.remove();

                    outer = $("<div id='client-balances' class='lightbox'></div>").appendTo('body');
                    middle = $('<div />').appendTo(outer);
                    $('<div>' + data + '</div>').appendTo(middle);

                    $('#client-balances [bcont=1]').on('click', function () {
                        $('#client-balances').remove();
                    });
                },
            }).always(function() {
                $('#view-balances').removeClass("disabled");
            });
        });
    },
    localize_for: function(language) {
        text = texts[language];
        moment.locale(language.toLowerCase());
    },
    url_for_language: function(lang) {
        lang = lang.trim().toUpperCase();
        SessionStore.set('selected.language', lang);
        var loc = document.location; // quick access
        var qs = loc.search || '?';
        var url = loc.protocol + '//' + loc.host + loc.pathname;
        if (qs.indexOf('l=') >= 0) {
            url += qs.replace(/(\?|&)l=[A-Z_]{2,5}/, "$1l=" + lang);
        } else {
            if (qs.length > 1) {
                lang = '&l=' + lang;
            } else {
                lang = 'l=' + lang;
            }
            url += qs + lang;
        }
        return url;
    },
    record_affiliate_exposure: function() {
        var token = this.url.param('t');
        var token_valid = /\w{32}/.test(token);
        var is_subsidiary = /\w{1}/.test(this.url.param('s'));

        if (!token_valid) {
            return false;
        }

        var cookie_value = $.cookie('affiliate_tracking');
        if(cookie_value) {
            var cookie_token = JSON.parse(cookie_value);

            //Already exposed to some other affiliate.
            if (is_subsidiary && cookie_token && cookie_token["t"]) {
                return false;
            }
        }

        //Record the affiliate exposure. Overwrite existing cookie, if any.
        var cookie_hash = {};
        if (token_valid) {
            cookie_hash["t"] = token.toString();
        }
        if (is_subsidiary) {
            cookie_hash["s"] = "1";
        }

        $.cookie("affiliate_tracking", JSON.stringify(cookie_hash), {
            expires: 365, //expires in 365 days
            path: '/',
            domain: '.' + location.hostname.split('.').slice(-2).join('.')
        });
    }
};
;//For object shape coherence we create named objects to be inserted into the queue.
var URLPjaxQueueElement = function(exec_function, url) {
    this.method = exec_function;
    if(url) {
        this.url = new RegExp(url);
    } else {
        this.url = /.*/;
    }
};

URLPjaxQueueElement.prototype = {
    fire: function(in_url) {
        if(this.url.test(in_url)) {
            this.method();
        }
    }
};

var IDPjaxQueueElement = function(exec_function, id) {
    this.method = exec_function;
    this.sel = '#' + id;
};

IDPjaxQueueElement.prototype = {
    fire: function() {
        if($(this.sel).length > 0) {
            this.method();
        }
    }
};

var PjaxExecQueue = function () {
    this.url_exec_queue = [];
    this.id_exec_queue = [];
    this.fired = false;
    this.content = $('#content');
};

PjaxExecQueue.prototype = {
    queue: function (exec_function) {
        this.url_exec_queue.unshift(new URLPjaxQueueElement(exec_function));
    },
    queue_for_url: function (exec_function, url_pattern) {
        this.url_exec_queue.unshift(new URLPjaxQueueElement(exec_function, url_pattern));
    },
    queue_if_id_present: function(exec_function, id) {
        this.id_exec_queue.unshift(new IDPjaxQueueElement(exec_function, id));
    },
    fire: function () {
        if(!this.fired) {
            var match_loc = window.location.pathname;
            var i = this.url_exec_queue.length;
            while(i--) {
                this.url_exec_queue[i].fire(match_loc);
            }

            i = this.id_exec_queue.length;
            while(i--) {
                this.id_exec_queue[i].fire(match_loc);
            }
        }
        this.fired = true;
    },
    reset: function() {
        this.fired = false;
    },
    loading: function () {
        this.reset();
    },
    count: function () {
        return exec_queue.length;
    },
    show: function (for_url) {
        for (var i=0; i < exec_queue.length; i++) {
            if(for_url) {
                if(exec_queue[i].url.test(for_url)) {
                    console.log("" + exec_queue[i].method);
                }
            } else {
                console.log(exec_queue[i].url + " : " + exec_queue[i].method);
            }
        }
    }
};

var pjax_config_page = function(url, exec_functions) {
    var functions = exec_functions();
    if (functions.onLoad) onLoad.queue_for_url(functions.onLoad, url);
    if (functions.onUnload) onUnload.queue_for_url(functions.onUnload, url);
};

var pjax_config = function() {
    return {
        'container': 'content',
        'beforeSend': function() {
            onLoad.loading();
            onUnload.fire();
        },
        'complete': function() {
            onLoad.fire();
            onUnload.reset();
        },
        'error': function(event) {
            var error_text = SessionStore.get('errors.500');
            if(error_text) {
                $('#content').html(error_text);
            } else {
                $.get('/errors/500.html').always(function(content) {
                    var tmp = document.createElement('div');
                    tmp.innerHTML = content;
                    tmpNodes = tmp.getElementsByTagName('div');
                    for(var i=0,l=tmpNodes.length;i<l;i++){
                        if(tmpNodes[i].id == 'content') {
                            SessionStore.set('errors.500', tmpNodes[i].innerHTML);
                            $('#content').html(tmpNodes[i].innerHTML);
                            break;
                        }
                    }
                });
            }

            $('#server_clock').html('GMT Time: ' + moment(page.header.time_now).utc().format("YYYY-MM-DD HH:mm"));

        },
        'useClass': 'pjaxload',
    };
};

var init_pjax = function () {
    var document_location = document.URL;
    if(!/backoffice/.test(document_location)) { //No Pjax for backoffice.
        pjax.connect(pjax_config());
    }
};

var load_with_pjax = function(url) {
        if(page.url.is_in(new URL(url))) {
            return;
        }

        var config = pjax_config();
        config.url = url;
        config.update_url = url;
        config.history = true;
        pjax.invoke(config);
};
;var isStorageSupported = function(storage) {
    if(typeof storage === 'undefined') {
        return false;
    }

    var testKey = 'test';
    try {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
    } catch(e) {
        return false;
    }
};

var Store = function(storage) {
    this.storage = storage;
};

Store.prototype = {
      get: function(key) {
          return this.storage.getItem(key) ? this.storage.getItem(key) : undefined;
      },
      set: function(key, value) {
          if(typeof value != "undefined") {
              this.storage.setItem(key, value);
          }
      },
      remove: function(key) {
          this.storage.removeItem(key);
      },
      clear: function() {
          this.storage.clear();
      },
};

var InScriptStore = function(object) { 
    this.store = typeof object !== 'undefined' ? object : {};
};

InScriptStore.prototype = {
    get: function(key) {
        return this.store[key];
    },
    set: function(key, value) {
        this.store[key] = value;
    },
    remove:  function(key) {
        this.store[key] = undefined;
    },
    clear: function() {
        this.store = {};
    }
};

var CookieStorage = function (cookie_name) {
    this.initialized = false;
    this.cookie_name = cookie_name;
    this.domain = '.' + document.domain.split('.').slice(-2).join('.');
    this.expires = new Date('Thu, 1 Jan 2037 12:00:00 GMT');
    this.value = {};
};

CookieStorage.prototype = {
    read: function() {
        var cookie_value = $.cookie(this.cookie_name);
        try {
            this.value = cookie_value ? JSON.parse(cookie_value) : {};
        } catch (e) {
            this.value = {};
        }
        this.initialized = true;
    },
    get: function(key) {
        if (!this.initialized) this.read();
        return this.value[key];
    },
    set: function(key, value) {
        if (!this.initialized) this.read();
        this.value[key] = value;
        $.cookie(this.cookie_name, JSON.stringify(this.value), {
            expires: this.expires,
            path: '/',
            domain: this.domain,
        });
    }
};

var Localizable = function(hash) {
    this.texts = typeof hash !== 'undefined'? hash : {};
};

Localizable.prototype = {
    localize: function(text, params) {
        var index = text.replace(/[\s|.]/g, '_');
        return this.texts[index] || text;
    }
};
;// for IE (before 10) we use a jquery plugin called jQuery.XDomainRequest. Explained here,
//http://stackoverflow.com/questions/11487216/cors-with-jquery-and-xdomainrequest-in-ie8-9
//
$(document).ajaxSuccess(function () {
    var contents = new Contents(page.client, page.user);
    contents.on_load();
});


var onLoad = new PjaxExecQueue();
var onUnload = new PjaxExecQueue();

var SessionStore, LocalStore;
if (isStorageSupported(window.localStorage)) {
    LocalStore = new Store(window.localStorage);
}

if (isStorageSupported(window.sessionStorage)) {
    if (!LocalStore) {
        LocalStore = new Store(window.sessionStorage);
    }

    SessionStore = new Store(window.sessionStorage);
}

if (!SessionStore || !LocalStore) {
    if (!LocalStore) {
        LocalStore = new InScriptStore();
    }

    if (!SessionStore) {
        SessionStore = new InScriptStore();
    }
}

var Settings = new CookieStorage('settings');

var page = new Page(window.page_params);

onLoad.queue(function () {
    page.on_load();
});

onUnload.queue(function () {
    page.on_unload();
});

var bo_url;

//////////////////////////////////////////////////////////////
//Purpose: To solve cross domain logged out server problem.
//Return: Hostname for this page
//////////////////////////////////////////////////////////////
function changeUrlToSameDomain(url) {
    var re = new RegExp('^(http|https):\/\/[.a-zA-Z0-9-]+/');
    var server_name = window.location.protocol + '//' + window.location.hostname;
    var same_domain_url = url.replace(re, server_name + '/');
    return same_domain_url;
}

function formEffects() {
    var select_focus_event = function () {
        $(this)
            .addClass('focus')
            .siblings().addClass('focus')
            .parents('fieldset').addClass('focus');
    };
    var select_blur_event = function () {
        $(this)
            .removeClass('focus')
            .siblings().removeClass('focus')
            .parents('fieldset').removeClass('focus');
    };
    var input_focus_event = function () {
        $(this)
            .parent('div').addClass('focus')
            .parents('fieldset').addClass('focus');
    };
    var input_blur_event = function () {
        $(this)
            .parent('div').removeClass('focus')
            .parents('fieldset').removeClass('focus');
    };

    this.set = function (jqObject) {
        jqObject
            .delegate('select', 'focus', select_focus_event)
            .delegate('select', 'blur', select_blur_event);

        jqObject
            .delegate('input[type=text],input[type=password],textarea', 'focus', input_focus_event)
            .delegate('input[type=text],input[type=password],textarea', 'blur', input_blur_event);
    };
}

onLoad.queue(function () {

    MenuContent.init($('#betsBottomPage'));

    // attach the class to account form's div/fieldset for CSS visual effects
    var objFormEffect = new formEffects();
    objFormEffect.set($('form.formObject'));

    var i = window.location.href.split('#');
    if (i.length != 2) return;
    var o = document.getElementsByTagName('a');
    for (var t = 0; t < o.length; t++) {
        if (o[t].href.substr(o[t].href.length - i[1].length - 1) == '#' + i[1]) {
            o[t].click();
            break;
        }
    }

});

onLoad.queue(function () {
    attach_inpage_popup('.has-inpage-popup');
    initTabs();
    initDateTimePicker();
});
;//
//
//
// This script contains various functions used by our forms.
// NOTE: Since you might not find reference to these functions within our javascripts you might delete some stuff from here without cleaning up forms.
//
function clearInputErrorField(id) {
    var errorfield = document.getElementById(id);
    if (errorfield) {
        // we need to create a brand new passage element and replace to the existing one.
        // IE6 does not treat null/empty string as empty innerHTML (which means it will appear at the IE browswer)
        var parentNode = errorfield.parentNode;
        if (parentNode) {
            var passage = document.createElement('p');
            passage.id = errorfield.id;
            passage.className = errorfield.className;
            parentNode.replaceChild(passage, errorfield);
            return passage;
        }
        return errorfield;
    }
}

function swithTabIfError(IsErrorFound)
{
    if (IsErrorFound)
    {
        $('.errorfield').each(function ()
        {
            if (this.innerHTML.length > 0)
            {
                MenuContent.trigger({
                    'content_id': $(this).parents('[id*=-content]').attr('id')
                });
            }
        });
        return 1;
    }
    else
    {
        return 0;
    }
}

;function push_data_layer() {
    var info = gtm_data_layer_info();
    for (var i=0;i<info.length;i++) {
        dataLayer[0] = info[i].params;

        dataLayer.push(info[i].params);
        dataLayer.push({"event": info[i].event});
    }
}

onLoad.queue(push_data_layer);
;var live_chart;
var chart_closed;
var ticks_array = [];


function updateLiveChart(config) {
    if (live_chart) {
        if (!chart_closed) {
            live_chart.close_chart();
        }
        live_chart = null;
    }

    if (config.resolution == 'tick') {
        live_chart = new LiveChartTick(config);
    } else {
        live_chart = new LiveChartOHLC(config);
    }
    live_chart.show_chart();
    chart_closed = false;
}

var LiveChart = function(config) {
    //Required for inheritence.
    if (!config) return;

    this.config = config;
    this.shift = false;
    if (!config.trade_visualization) {
        this.on_duration_change();
        this.highlight_duration();
    }
};

LiveChart.prototype = {
    show_chart: function() {
        $('.notice').hide();
        this.chart = new Highcharts.StockChart(this.chart_params());
        this.chart.showLoading();
    },
    close_chart: function() {
        $(".live_charts_stream_button").off('click');
        if (this.ev) {
            this.ev.close();
        }

        if (!chart_closed && live_chart) {
            if (this.chart) {
                this.chart.destroy();
            }
            chart_closed = true;
            live_chart = null;
        }
    },
    add_indicator: function(indicator) {
        this.config.add_indicator(indicator);
        indicator.paint(this);
    },
    remove_indicator: function(name) {
        var indicator = this.config.remove_indicator(name);
        if(indicator) {
            indicator.remove(this);
        }
    },
    exporting_menu: function() {
        var $self = this;
        var menuItems = [];

        var defaultOptions = Highcharts.getOptions();
        var defaultMenu = defaultOptions.exporting.buttons.contextButton.menuItems;
        for (var i=0; i<defaultMenu.length; i++) {
            menuItems.push(defaultMenu[i]);
        }

        return menuItems;
    },
    connect_to_stream: function() {
        var $self = this;
        var url = window.location.protocol + "//" + this.config.streaming_server;
        var end = this.config.to ? "/" + this.config.to : "";
        url += "/stream/ticks/" + this.config.symbol.symbol + "/" + this.config.from + end + "?adjust_start_time=1&with_trades=" + this.config.with_trades;
        if (this.config.resolution != 'tick') {
            url += "&ohlc=" + this.config.resolution;
        }
        this.ev = new EventSource(url, { withCredentials: true });
        this.ev.onmessage = function(msg) {
            $self.process_message(msg);
        };
        this.ev.onerror = function() { $self.ev.close(); };
    },
    process_contract: function(trade) {
        if (!this.tradeSeries) {
            this.tradeSeries = this.chart.addSeries({
                name: "Contracts",
                type: "flags",
                data: [],
                onSeries: 'primary_series',
                shape: "circlepin",
                includeInCSVExport: false,
            }, false, false);
        }
        var epoch = 1000 * parseInt(trade.start_time);
        var text = "Contract ID: " + trade.buy_id + "<br>" + trade.long_code;
        var color = "white";
        if (trade.is_sold) {
            if (trade.won) {
                text += "<br>Result: Won";
                color = "green";
            } else {
                text += "<br>Result: Lost";
                color = "red";
            }
        }
        var cpoint = {
            x: epoch,
            title: "C",
            fillColor: color,
            text: text
        };
        this.tradeSeries.addPoint(cpoint, false, false, false);
    },
    chart_params: function() {
        var $self = this;
        var chart_params = {
            chart: {
                height: this.config.renderHeight,
                renderTo: this.config.renderTo,
                events: {
                    load: function() { $self.connect_to_stream(); }
                }
            },
            credits: {
                enabled: false
            },
            exporting: {
                buttons: {
                    contextButton: {
                        menuItems: this.exporting_menu()
                    }
                },
                enabled: true
            },
            plotOptions: {
                series: {
                    dataGrouping: {
                        dateTimeLabelFormats: {
                            millisecond: ['%A, %b %e, %H:%M:%S.%L GMT', '%A, %b %e, %H:%M:%S.%L', '-%H:%M:%S.%L GMT'],
                            second: ['%A, %b %e, %H:%M:%S GMT', '%A, %b %e, %H:%M:%S', '-%H:%M:%S GMT'],
                            minute: ['%A, %b %e, %H:%M GMT', '%A, %b %e, %H:%M', '-%H:%M GMT'],
                            hour: ['%A, %b %e, %H:%M GMT', '%A, %b %e, %H:%M', '-%H:%M GMT'],
                            day: ['%A, %b %e, %Y', '%A, %b %e', '-%A, %b %e, %Y'],
                            week: ['Week from %A, %b %e, %Y', '%A, %b %e', '-%A, %b %e, %Y'],
                            month: ['%B %Y', '%B', '-%B %Y'],
                            year: ['%Y', '%Y', '-%Y']
                        },
                        turboThreshold: 3000
                    },
                    marker: {
                        enabled: this.config.with_markers,
                        radius: 2,
                    },
                },
                candlestick: {
                    turboThreshold: 4000
                }
            },
            xAxis: {
                type: 'datetime',
                min: this.config.from * 1000,
            },
            yAxis: {
                opposite: false,
                labels: {
                    align: 'left',
                    x: 0,
                    formatter: function() { return this.value; }
                },
                title: {
                    text: null
                }
            },
            rangeSelector: {
                enabled: false,
            },
            title: {
                text: this.config.symbol.translated_display_name(),
            },
        };

        if (this.config.with_marker) {
            chart_params.plotOptions.line = {marker: {enabled: true}};
        }

        this.configure_series(chart_params);
        return chart_params;
    },
    process_message: function(message) {
        var data = JSON.parse(message.data);
        if (data.error) {
            this.ev.close();
            return;
        }
        if (data.notice) {
            $("#" + data.notice + "_notice").show();
            return;
        }
        if (!(data[0] instanceof Array)) {
            data = [ data ];
        }

        var data_length = data.length;
        for (var i = 0; i < data_length; i++) {
            this.process_data(data[i]);
        }

        if (data_length > 0 && this.spot) {
            this.config.repaint_indicators(this);
            this.chart.redraw();
            if (!this.navigator_initialized) {
                this.navigator_initialized = true;
                var xData = this.chart.series[0].xData;
                var xDataLen = xData.length;
                if (xDataLen) {
                    this.chart.xAxis[0].setExtremes(xData[0], xData[xDataLen - 1], true, false);
                }
            }
            this.chart.hideLoading();
            this.shift = this.config.shift == 1 ? true : false;
        }
    },
    highlight_duration: function() {
        $('#live_chart_duration').find('.live_charts_stream_button').each( function () {
            $(this).find('span').removeClass('current');
        });

         $('#live_chart_duration li[data-live=' + this.config.live + '] span').addClass('current');
    },
    on_duration_change: function() {
        var that = this;
        $(".live_charts_stream_button").on('click', function() {
            that.config.update({
                live: $(this).data("live"),
                update_url: 1
            });
            that.highlight_duration();
            updateLiveChart(that.config); //Will cause this object to unload.
            var duration_changed = jQuery.Event( "duration_change", { target: this, config: that.config } );
            $('#live_chart_duration').trigger(duration_changed);
        });
    }
};

function LiveChartTick(params) {
    LiveChart.call(this, params);
}

LiveChartTick.prototype = new LiveChart();

LiveChartTick.prototype.constructor = LiveChartTick;
LiveChartTick.prototype.configure_series = function(chart_params) {
        chart_params.chart.type = 'line';

        chart_params.xAxis.labels = { format: "{value:%H:%M:%S}" };
        chart_params.series = [{
            name: this.config.symbol.translated_display_name(),
            data: [],
            dataGrouping: {
                enabled: false
            },
            id: 'primary_series',
            tooltip: {
                xDateFormat: "%A, %b %e, %H:%M:%S GMT"
            },
            type: 'line'
        }];
};

LiveChartTick.prototype.process_data = function(point) {
    if (point[0] == 'tick') {
        var tick = {
            epoch: parseInt(point[1]),
            quote: parseFloat(point[2])
        };

        if (!this.chart) return;
        if (!this.chart.series) return;

        this.chart.series[0].addPoint(
            [tick.epoch * 1000, tick.quote], false, this.shift, false
        );
        this.spot = tick.quote;
        // for tick trade charting purposes
        if (tick.epoch > this.config.contract_start_time && ticks_array.length < this.config.how_many_ticks) {
                ticks_array.push(tick);
        }
    } else if (point[0] == 'contract') {
        this.process_contract(point[1]);
    }
};


function LiveChartOHLC(params) {
    LiveChart.call(this, params);
    this.candlestick = {};
    this.candlestick.period = this.config.resolution_seconds() * 1000;
}

LiveChartOHLC.prototype = new LiveChart();
LiveChartOHLC.prototype.constructor = LiveChartOHLC;

LiveChartOHLC.prototype.configure_series = function(chart_params) {
    chart_params.chart.type = 'candlestick';
    chart_params.series = [{
        name: this.config.symbol.translated_display_name(),
        data: [],
        color: 'red',
        upColor: 'green',
        id: 'primary_series',
        type: 'candlestick',
    }];
};

LiveChartOHLC.prototype.process_data = function(point) {
    var type = point.shift();
    if (type == 'ohlc') {
        this.process_ohlc(point);
    } else if (type == 'tick') {
        if (this.accept_ticks) {
                this.process_tick(point);
        }
    } else if (type == 'corp_action') {
        this.process_corp_action(point);
    } else if (type == 'contract') {
        this.process_contract(point[0]);
    }
};

LiveChartOHLC.prototype.process_corp_action = function(action) {
    if (!this.flagSeries) {
        this.flagSeries = this.chart.addSeries({
            name: "Events",
            type: "flags",
            data: [],
            shape: "flag"
        }, false, false);
    }

    var epoch = 1000 * parseInt(action[0].epoch);
    var text = action[0].description;
    var point = {
        x: epoch,
        title: "CA",
        text: text
    };

    this.flagSeries.addPoint(point, false, false, false);
};

LiveChartOHLC.prototype.process_ohlc = function(ohlc) {
    var epoch = parseInt(ohlc[0]);
    if (!this.chart) return;
    if (!this.chart.series) return;
    var ohlc_pt = {
        x:     epoch * 1000,
        open:  parseFloat(ohlc[1]),
        y:     parseFloat(ohlc[1]),
        high:  parseFloat(ohlc[2]),
        low:   parseFloat(ohlc[3]),
        close: parseFloat(ohlc[4])
    };
    this.chart.series[0].addPoint(ohlc_pt, false, false, false);
    this.spot = ohlc_pt.close;
    this.accept_ticks = true;
};

LiveChartOHLC.prototype.process_tick = function(tickInput) {
    var tick = {
        epoch: parseInt(tickInput[0]) * 1000,
        quote: parseFloat(tickInput[1]),
        squote: tickInput[1]
    };
    this.spot = tick.quote;

    if (!this.chart) return;
    if (!this.chart.series) return;

    var data = this.chart.series[0].options.data;
    if (data.length > 0 && data[data.length - 1].x > (tick.epoch - this.candlestick.period)) {
        var last_ohlc = data[data.length - 1];
        if (tick.quote != last_ohlc.close) {
            last_ohlc.close = tick.quote;
            if (last_ohlc.low > tick.quote)
                last_ohlc.low = tick.quote;
            if (last_ohlc.high < tick.quote)
                last_ohlc.high = tick.quote;

            this.chart.series[0].isDirty = true;
            this.chart.series[0].isDirtyData = true;
        }
    } else {
        /* add new Candlestick */
        var ohlc = {
            x:     tick.epoch,
            open:  tick.quote,
            y:     tick.quote,
            high:  tick.quote,
            low:   tick.quote,
            close: tick.quote
        };
        this.chart.series[0].addPoint(ohlc, false, false, false);
    }
};
;var LiveChartConfig = function(params) {
    params = params || {};
    this.renderTo = params['renderTo'] || 'live_chart_div';
    this.renderHeight = params['renderHeight'] || 450;
    this.shift = typeof params['shift'] !== 'undefined' ? params['shift'] : 1;
    this.with_trades = typeof params['with_trades'] !== 'undefined' ? params['with_trades'] : 1;
    this.streaming_server = page.settings.get('streaming_server');
    this.with_marker = typeof params['with_marker'] !== 'undefined' ? params['with_marker'] : 0;
    this.force_tick = typeof params['force_tick'] !== 'undefined' ? params['force_tick'] : 0;

    this.indicators = [];
    this.resolutions = {
        'tick': {seconds: 0, interval: 3600},
        '1m': {seconds: 60, interval: 86400},
        '5m': {seconds: 300, interval: 7*86400},
        '30m': {seconds: 1800, interval: 31*86400},
        '1h': {seconds: 3600, interval: 62*86400},
        '8h': {seconds: 8*3600, interval: 183*86400},
        '1d': {seconds: 86400, interval: 366*3*86400}
    };
    this.resolution = 'tick';
    this.with_markers = typeof params['with_markers'] !== 'undefined' ? params['with_markers'] : false;

    var res,
        symbol,
        hash = window.location.hash;

    res = hash.match(/^#([A-Za-z0-9_]+):(10min|1h|1d|1w|1m|3m|1y)$/);
    if (res) {
        symbol = markets.by_symbol(res[1]);
        if (symbol) {
            this.symbol = symbol.underlying;
            this.market = symbol.market;
            this.live = res[2];
        }
    } else {
        res = hash.match(/^#([A-Za-z0-9_]+):([0-9]+)-([0-9]+)$/);
        if (res) {
            symbol = markets.by_symbol(res[1]);
            if (symbol) {
                this.symbol = symbol.underlying;
                this.market = symbol.market;
                this.from = parseInt(res[2]);
                this.to = parseInt(res[3]);
                this.resolution = this.best_resolution(this.from, this.to);
            }
        } else {
            symbol = markets.by_symbol(params['symbol']) || markets.by_symbol(LocalStore.get('live_chart.symbol')) || markets.by_symbol('R_100');
            this.symbol = symbol.underlying;
            this.market = symbol.market;
            var from = params['from'] || LocalStore.get('live_chart.from');
            var to = params['to'] || LocalStore.get('live_chart.to');
            if (from && to && from != 'null' && to != 'null') {
                this.from = from;
                this.to = to;
                this.resolution = this.best_resolution(this.from, this.to);
            } else {
                this.live = params['live'] || LocalStore.get('live_chart.live') || '10min';
            }
        }
    }

    if (this.live) {
        this.from = this.calculate_from(this.live);
        this.resolution = this.best_resolution(this.from, new Date().getTime()/1000);
    }
};

LiveChartConfig.prototype = {
    add_indicator: function(indicator) {
        this.indicators.push(indicator);
    },
    remove_indicator: function(name) {
        var deleted_indicator;
        var indicator = this.indicators.length;
        while(indicator--) {
            if(this.indicators[indicator].name == name) {
                deleted_indicator = this.indicators[indicator];
                this.indicators.splice(indicator, 1);
            }
        }
        return deleted_indicator;
    },
    has_indicator: function(name) {
        var indicator = this.indicators.length;
        while(indicator--) {
            if(this.indicators[indicator].name == name) {
                return true;
            }
        }
        return false;
    },
    repaint_indicators: function(chart) {
        var indicator = this.indicators.length;
        while(indicator--) {
            this.indicators[indicator].repaint(chart);
        }
    },
    calculate_from: function(len) {
        var now = new Date();
        var epoch = Math.floor(now.getTime() / 1000);
        var units = { min: 60, h: 3600, d: 86400, w: 86400 * 7, m: 86400 * 31, y: 86400 * 366 };
        var res = len.match(/^([0-9]+)([hdwmy]|min)$/);
        
        return res ? epoch - parseInt(res[1]) * units[res[2]] : undefined;
    },
    update: function(opts) {
        if (opts.interval) {
            var from = parseInt(opts.interval.from.getTime() / 1000);
            var to = parseInt(opts.interval.to.getTime() / 1000);
            var length = to - from;
            this.resolution = this.best_resolution(from, to);
            delete opts.interval;
            this.from = from;
            this.to = to;
            delete this.live;
        }
        if (opts.live) {
            delete this.to;
            LocalStore.remove('live_chart.to');
            LocalStore.remove('live_chart.from');
            this.from = this.calculate_from(opts.live);
            this.live = opts.live;
            LocalStore.set('live_chart.live', opts.live);
            this.resolution = this.best_resolution(this.from, new Date().getTime()/1000);
        }
        if (opts.symbol) {
            var symbol = markets.by_symbol(opts.symbol);
            if(symbol) {
                this.symbol = symbol.underlying;
                this.market = symbol.market;
                LocalStore.set('live_chart.symbol', symbol.symbol);
            }
        }

        if(opts.update_url) {
            var hash = "#";

            if (this.from && this.to) {
                hash += this.symbol.symbol + ":" + this.from + "-" + this.to;
            } else {
                hash += this.symbol.symbol + ":" + this.live;
            }

            var url = window.location.pathname + window.location.search + hash;
            page.url.update(url);
        }
        if(opts.shift) {
            this.shift = opts.shift;
        }
        if(opts.with_trades) {
            this.with_trades = opts.with_trades;
        }
        if(opts.with_markers) {
            this.with_markers = opts.with_markers;
        }
        if(opts.force_tick) {
            this.force_tick = opts.force_tick;
        }
    },
    best_resolution: function(from, to) {
        if(this.force_tick) {
            return 'tick';
        }
        var length = parseInt(to - from);
        for(var resolution in this.resolutions) {
            if (this.resolutions[resolution].interval >= length) {
                return resolution;
            }
        }
        return '1d';
    },
    resolution_seconds: function(resolution) {
        resolution = typeof resolution !== 'undefined' ? resolution : this.resolution;
        return this.resolutions[resolution]['seconds'];

    },
};

var configured_livechart = false;
var configure_livechart = function () {
    if(!configured_livechart) {
        Highcharts.setOptions({
            lang: {
                loading:      text.localize('loading...'),
                printChart:   text.localize('Print chart'),
                downloadJPEG: text.localize('Save as JPEG'),
                downloadPNG:  text.localize('Save as PNG'),
                downloadSVG:  text.localize('Save as SVG'),
                downloadPDF:  text.localize('Save as PDF'),
                downloadCSV:  text.localize('Save as CSV'),
                rangeSelectorFrom: text.localize('From'),
                rangeSelectorTo:   text.localize('To'),
                rangeSelectorZoom: text.localize('Zoom'),
                months: [
                    text.localize('January'), text.localize('February'), text.localize('March'), text.localize('April'), text.localize('May'), text.localize('June'),
                    text.localize('July'), text.localize('August'), text.localize('September'), text.localize('October'), text.localize('November'), text.localize('December')
                ],
                shortMonths: [
                    text.localize('Jan'), text.localize('Feb'), text.localize('Mar'), text.localize('Apr'), text.localize('May'), text.localize('Jun'),
                    text.localize('Jul'), text.localize('Aug'), text.localize('Sep'), text.localize('Oct'), text.localize('Nov'), text.localize('Dec')
                ],
                weekdays: [
                    text.localize('Sunday'), text.localize('Monday'), text.localize('Tuesday'), text.localize('Wednesday'),
                    text.localize('Thursday'), text.localize('Friday'), text.localize('Saturday')
                ],
            },
            navigator: {
                series: {
                    includeInCSVExport: false
                }
            }
        });
    }
    configured_livechart = true;
};
;var LiveChartIndicator = {};
LiveChartIndicator['Barrier'] = function(params) {
    this.name = params['name'];
    this.value = typeof params['value'] !== 'object' ? parseFloat(params['value']) : params['value'];
    this.color = params['color'] || 'blue';
    this.width = params['width'] || 2;
    this.id = 'barrier_' + this.name;
    this.is_relative = /^[+-]/.test(params['value']);
    this.painted = false;
    this.label = params['label'] || '';
    this.axis = params['axis'] || 'y';
    this.nomargin = params['nomargin'] || false;
};


LiveChartIndicator['Barrier'].prototype = {
    remove: function(that) {
        if(!that.chart){
            return;
        }
        if (this.axis == 'y') {
            if(!that.chart.yAxis){
                return;
            }
            that.chart.yAxis[0].removePlotLine(this.id);
        } else {
            if(!that.chart.xAxis){
                return;
            }
            that.chart.xAxis[0].removePlotLine(this.id);
        }
    },
    repaint: function(that) {
        if (this.is_relative || !this.painted) {
            this.remove(that);
            this.paint(that);
            return true;
        }

        return false;
    },
    paint: function(that) {
        var value = this.value;
        if (this.is_relative) {
            if (that.spot) {
                value = that.spot + value;
            } else {
                return;
            }
        }

        var plot_option = { value: value, color: this.color, width: this.width, id: this.id };
        if (this.label) {
            if (this.axis == 'x') {
                if(this.nomargin) {
                    plot_option.label = {text: text.localize(this.label), verticalAlign: 'middle', textAlign: 'center' };
                } else {
                    plot_option.label = {text: text.localize(this.label), verticalAlign: 'middle', x: -10, textAlign: 'center' };
                }
            } else {
                plot_option.label = {text: text.localize(this.label), align: 'center'};
            }
        }
        if (!that.chart) {
            return;
        }
        if (this.axis == 'y') {
            if (!that.chart.yAxis) {
                return;
            }
            that.chart.yAxis[0].addPlotLine(plot_option);
        } else {
            if (!that.chart.xAxis) {
                return;
            }
            that.chart.xAxis[0].addPlotLine(plot_option);
        }
        this.painted = true;
    }
};
;/*
 * Make sure data js is loaded before this
 * else website will not work properly
 * objects texts_json, markets_list, markets_json
 * should be available
 */

// make texts object as Localizable
var texts = {};
for (var key in texts_json) {
    if (texts_json.hasOwnProperty(key)) {
        texts[key] = new Localizable(texts_json[key]);
    }
}

// make markets object
var markets = new Markets(markets_list, markets_json);
;init_pjax(); //Pjax-standalone will wait for on load event before attaching.
$(function() { onLoad.fire(); });
;// json to hold all the events loaded on trading page
var trade_event_bindings = {};

function contract_guide_popup() {
    $('.contract-guide-content').on('click', '.bet_demo_link', function (e){
        e.preventDefault();
        var ip = new InPagePopup();
        ip.ajax_conf = { url: this.href, data: 'ajax_only=1' };
        ip.fetch_remote_content(true, '', function (data) {
            return data;
        });
    });
}

var trading_times_init = function() {
     var url = page.url.url_for('resources/trading_times', 'date=' + dateText, 'cached'),
         oneYearLater = moment().add(1, 'year').toDate();

     $("#tradingdate" ).pickadate({
         max: oneYearLater,
         onSet: function(context) {
             showLoadingImage($('#trading-tabs'));
             $.ajax({
                url: url,
                data:  { 'ajax_only': 1 },
                success: function(html){
                    $("#trading-tabs").replaceWith(html);
                    page.url.update(url);
                },
                error: function(xhr, textStatus, errorThrown){
                    trading_times.empty().append(textStatus);
                },
            });
        }
    });
};

function confirm_popup_action() {

    $('.bom_confirm_popup_link').on('click', function (e){
        e.preventDefault();
        $.ajax({
            type: 'GET',
            url: this.href,
            data: 'ajax_only=1',
            success: function (html) {
                SpotLight.set_content(html);
                SpotLight.show();
            }
        });
    });
}

var hide_payment_agents = function() {
    var language = page.language();
    if(language == 'JA') {
        $('.payment_agent_methods').addClass('invisible');
    }
};

function get_login_page_url() {
    var params = '';
    try {
        var lang = page.language();
        if (!lang) {
            throw new Error("failed to detect page language");
        }
        params += '?l=' + lang;
    } catch (e) {
        console.log("error while getting page language. " + e);
    }
    return 'https://' + page.settings.get('domains')['private'] + '/login' + params;
}

onLoad.queue_for_url(contract_guide_popup, 'contract_guide');
onLoad.queue_for_url(trading_times_init, 'trading_times');
onLoad.queue_for_url(confirm_popup_action, 'my_account|confirm_popup');
onLoad.queue_for_url(hide_payment_agents, 'cashier');

onLoad.queue_for_url(function() {
    $('div.further-info')
    .children('div').hide().end()
    .children('a').click(function() {
        $(this).siblings('div').toggle();
        return false;
    });
}, '/c/paymentagent_list');

$('.login-content button').on('click', function() {
    $('.form-logo').addClass('spinner');
});

$('.nav2nd a').on('click', function() {
    var nav2nd = $(this).parent().parent();
    nav2nd.hide();
    setTimeout(function() { nav2nd.show(); });
});

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    $(header).css('position', 'sticky');
}

$('.exhaustive-icon-list').html(function() {
    var icons = [
        'account-transfer',
        'address',
        'api-token',
        'asset-index',
        'cashier',
        'chat',
        'contact-us',
        'customer-service',
        'directions',
        'financial-assessment',
        'get-started-icon-1',
        'get-started-icon-2',
        'get-started-icon-3',
        'get-started-icon-4',
        'get-started-icon-5',
        'get-started-icon-6',
        'get-started-icon-7',
        'get-started-icon-8',
        'get-started-icon-9',
        'help',
        'highcharts',
        'javacharts',
        'limits',
        'live-chat',
        'livecharts',
        'myaccount',
        'payment-agents',
        'payment-methods',
        'portfolio',
        'pricing-table',
        'prize',
        'profit-table',
        'protection',
        'resources',
        'rise-fall-table',
        'safety',
        'security',
        'self-exclusion',
        'sharp-prices',
        'skype',
        'statement',
        'telephone',
        'trade-asian-down',
        'trade-asian-up',
        'trade-differs',
        'trade-ends-between',
        'trade-ends-outside',
        'trade-fall',
        'trade-goes-outside',
        'trade-higher',
        'trade-lower',
        'trade-match',
        'trade-notouch',
        'trade-rise',
        'trade-stays-between',
        'trade-touch',
        'trade',
        'trading-guide',
        'trading-times',
        'user'
    ];

    var iconList = icons.map(function(i) {
            return '<div style="float: left; width: 10rem; height: 10rem">' +
                        '<div class="icon">' +
                            '<img src="https://static.binary.com/images/icons/' + i + '.svg">' +
                        '</div>' +
                        '<div style="text-align: center; margin-top: .5rem">' + i + '</div>' +
                    '</div>';
        }).join('');

    return iconList;
});
;var trade_contract_back = function () {
    $('#find_another_contract').on('click', function (e) {
        if (page.url.history_supported) {
            e.preventDefault();
            window.history.back();
        }
    }).addClass('unbind_later');
};

var toggleStreaming = function() {
   if (document.hidden || document.webkitHidden) {
       BetForm.spot.clear();
       BetPrice.streaming.stop();
       BetPrice.order_form.hide_buy_button();
   } else {
       BetPrice.streaming.start();
   }
};

pjax_config_page('/trade', function() {
    return {
        onLoad: function() {
            trade_contract_back();
            BetForm.init();
            BetAnalysis.register_actions();
            BetForm.restore();
            if (typeof document.webkitHidden !== 'undefined') {
                if (document.addEventListener) {
                    document.addEventListener("webkitvisibilitychange", toggleStreaming, false);
                }
            } else if (typeof document.hidden !== 'undefined') {
                if (document.addEventListener) {
                    document.addEventListener("visibilitychange", toggleStreaming);
                }
            }

        },
        onUnload: function() {
            BetForm.unregister_actions();
            BetPrice.deregister();
            BetPrice.clear_buy_results();
            BetPrice.streaming.stop();
            BetAnalysis.reset();
            if (typeof document.webkitHidden !== 'undefined') {
                document.removeEventListener("webkitvisibilitychange", toggleStreaming);
            } else if (typeof document.hidden !== 'undefined') {
                document.removeEventListener("visibilitychange", toggleStreaming);
            }
        }
    };
});

pjax_config_page('rise_fall_table', function() {
    var duration_amount;
    var duration_unit;
    return {
        onLoad: function() {
            var trading_time = new BetForm.TradingTime();
            var duration = new BetForm.Time.Duration(trading_time);
            trading_time.init();
            //Perform as if we are pricing R_100 bets.
            trading_time.underlying = function() {
                return 'R_100';
            };

            var selected_duration;
            //We dont want to read/pollute our betform durations.
            trading_time.value = function(value) {
                if(value) {
                    selected_duration = value;
                }

                if(!selected_duration) {
                    var duration = page.url.param('duration_amount');
                    var units = page.url.param('duration_units');
                    if(typeof duration_amount === 'undefined' || typeof duration_amount === 'undefined') {
                        var min_unit = this.min_unit();
                        duration = min_unit.min;
                        unit = min_unit.units;
                    }

                    selected_duration = duration + unit;
                }

                return selected_duration;
            };

            duration.init();
            duration.register();
            duration.update_ui();

            $('#atleast').on('change', function () {
                duration.update_units_select();
                duration.update_ui();
            }).addClass('unbind_later');

            $('#rise_fall_calculate').on('click', function (event) {
                event.preventDefault();
                var calculate_button = this;
                $(this).hide();
                $('#rise_fall_calculating').show();
                var form = $('form[name=rise_fall]').get(0);
                var url = page.url.url_for('resources/rise_fall_table', getFormParams(form));
                $('#rise_fall_prices_div').html('');
                $.ajax({
                    url: url,
                    data: {
                            ajax_only: 1,
                            prices_only:  1,
                        },
                }).done(function(response) {
                    $('#rise_fall_prices_div').html(response);
                    page.url.update(url);
                    $('#rise_fall_calculating').hide();
                    $('#rise_fall_calculate').show();
                });
            }).addClass('unbind_later');
        },
    };
});

pjax_config_page('portfolio|trade.cgi|statement|f_manager_statement|f_manager_history|f_profit_table|profit_table', function() {
    return {
        onLoad: function() {
            BetSell.register();
        },
        onUnload: function() {
            BetSell.cleanup();
        }
    };
});

pjax_config_page('chart_application', function () {
    return {
        onLoad: function () {
            load_chart_app();
        }
    };
});
;var BetAnalysis = function () {
    var tab_change_registered = false;
    var restored = false;
    return {
        reset: function(){
            restored = false;
            this.tab_live_chart.reset();
        },
        register_actions: function () {
            var that = this;
            if(tab_change_registered) {
                return;
            }

            tab_change_registered = true;
            MenuContent.listen_click(function (tab) {
                if (tab.menu.attr('id') == 'betsBottomPage') {
                    that.save(tab);

                    var id = tab.id;
                    var shown_some_tab = false;
                    if (id == 'tab_explanation') {
                        that.tab_explanation.render(tab);
                        shown_some_tab = true;
                    } else if(id == 'tab_ohlc' && BetForm.attributes.show_ohlc()) {
                        that.tab_ohlc.render(tab);
                        shown_some_tab = true;
                    } else if(id == 'tab_intradayprices') {
                        that.tab_intradayprices.render(tab);
                        shown_some_tab = true;
                    } else if(id == 'tab_last_digit') {
                        that.tab_last_digit.render(tab);
                        shown_some_tab = true;
                    } else if(id == 'tab_graph') {
                        that.tab_live_chart.render();
                        shown_some_tab = true;
                    } else if(id == 'tab_pricing_table') {
                        that.tab_pricing_table.render(tab);
                        shown_some_tab = true;
                    }

                    if(!shown_some_tab) {
                        that.tab_explanation.render(tab);
                    }
                }

                return;
            });
        },
        save: function (tab) {
            SessionStore.set('bet_page.selected_analysis_tab', tab.id);
        },
        restore: function () {
            if(restored) {
                return;
            }
            this.show_tab(SessionStore.get('bet_page.selected_analysis_tab'));
            restored = true;
        },
        show_tab: function(tab) {
            if(!tab || !$('#' . tab)) {
                tab = 'tab_explanation';
            }

            if(!this.is_showing_tab(tab)) {
                MenuContent.trigger({
                    'tab_id': tab
                });
            }
        },
        is_showing_tab: function(tab) {
            return MenuContent.is_tab_selected($('#' + tab));
        },
        was_showing_tab: function(tab) {
            return (SessionStore.get('bet_page.selected_analysis_tab') == tab);
        },
        bet_type_changed: function(bet_type) {
            var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');
            if (this.is_showing_tab('tab_explanation')) {
                MenuContent.trigger({
                    'tab_id': saved_anaysis_tab
                });
            }
        },
        underlying_changed: function() {
            var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');

            if (this.is_showing_tab('tab_graph') || this.is_showing_tab('tab_pricing_table')) {
                MenuContent.trigger({
                    'tab_id': saved_anaysis_tab
                });
            }
        },
        duration_changed: function() {
            var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');

            if (this.is_showing_tab('tab_graph') || this.is_showing_tab('tab_pricing_table')) {
                MenuContent.trigger({
                    'tab_id': saved_anaysis_tab
                });
            }
        },
        get_price_data: function (form, div, id) {
            var that = this;
            var daily_prices_url = changeUrlToSameDomain(form.action);
            var daily_prices_params = $(form).serialize()+'&id='+Math.floor(Math.random()*83720);

            var go_button = div.find('.button');
            go_button.addClass('invisible');
            go_button.after(getImageLink());

            $.ajax(ajax_loggedin({
                url     : daily_prices_url,
                async   : true,
                data    : daily_prices_params,
                success : function (texts) {
                    div.html(texts);
                    that.set_submit_event(id);
                },
            }));
        },
        set_submit_event: function(id) {
           var that = this;
           var div = $('#' + id + '-content');
           var submit_button = div.find('button[type=submit]');
           $(submit_button.closest('form')[0]).on('submit', function (e) {
                e.preventDefault();
                return false;
           });
           submit_button.on('click', function () {
               that.get_price_data($(this).closest('form')[0], div, id);
           });
        },
        tab_explanation: function() {
            return {
                render: function(tab) {
                    var that = this;
                    showLoadingImage(tab.content);
                    $.get(that.url(), function (texts) {
                        tab.content.html(texts);
                    });
                },
                url: function() {
                    var existing_link = $('#tab_explanation').find('a');
                    var url = existing_link.attr('href').replace(/form_name=\w+/,'form_name='+ BetForm.attributes.bet_type());
                    existing_link.attr('href', url);
                    return url;
                }
            };
        }(),
        tab_ohlc: function() {
            return {
                render: function(tab) {
                    showLoadingImage(tab.content);
                    $.get(this.url(tab), function (texts) {
                        tab.content.html(texts);
                    }).done(function (data) {
                        BetAnalysis.set_submit_event(tab.id);
                    });
                },
                url: function(tab) {
                    return tab.target.attr('href').replace(/&underlying_symbol=\w+/,'&underlying_symbol=' + BetForm.attributes.underlying());
                },
                show_tab: function() {
                    var tab_ohlc = $('#tab_ohlc');
                    MenuContent.show_tab(tab_ohlc);
                    var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');
                    if(saved_anaysis_tab == 'tab_ohlc') {
                        MenuContent.trigger({
                            'tab_id': saved_anaysis_tab
                        });
                    }
                },
                hide_tab: function() {
                    var tab_ohlc = $('#tab_ohlc');
                    MenuContent.hide_tab(tab_ohlc);
                }
            };
        }(),
        tab_intradayprices: function() {
            return {
                render: function(tab) {
                    showLoadingImage(tab.content);
                    $.get(this.url(tab), function (texts) {
                        tab.content.html(texts);
                    }).done(function (data) {
                        BetAnalysis.set_submit_event(tab.id);
                    });
                },
                url: function(tab) {
                    return tab.target.attr('href').replace(/underlying=\w+/,'underlying=' + BetForm.attributes.underlying());
                },
                show_tab: function() {
                    var tab_intradayprices = $('#tab_intradayprices');
                    MenuContent.show_tab(tab_intradayprices);
                    var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');
                    if(saved_anaysis_tab == 'tab_intradayprices') {
                        MenuContent.trigger({
                            'tab_id': saved_anaysis_tab
                        });
                    }
                },
                hide_tab: function() {
                    var tab_intradayprices = $('#tab_intradayprices');
                    MenuContent.hide_tab(tab_intradayprices);
                },
            };
        }(),
        tab_pricing_table: function() {
            return {
                render: function(tab) {
                    showLoadingImage(tab.content);
                    var expiry_type = BetForm.attributes.expiry_type();

                    formData = {
                        underlying_symbol: BetForm.attributes.underlying(),
                        H: BetForm.attributes.barrier_1(),
                        L: BetForm.attributes.barrier_2(),
                        barrier_type: BetForm.attributes.barrier_type(),
                        currency: BetForm.attributes.currency(),
                        amount_type:  'payout',
                        amount: 100,
                        form_name: BetForm.attributes.bet_type(),
                        expiry_type: expiry_type,
                    };
                    if (expiry_type === 'duration') {
                        formData['duration_amount'] = BetForm.attributes.duration_amount();
                        formData['duration_units'] = BetForm.attributes.duration_units();
                    } else {
                        formData['expiry_date'] = BetForm.attributes.expiry_date();
                        formData['expiry_time'] = BetForm.attributes.expiry_time();
                    }
                    $.ajax({
                        type: 'POST',
                        url: this.url(tab),
                        data: formData,
                        success: function(prices) {
                            tab.content.html(prices);
                            initTabs();
                        },
                        error: function(xhr, status) {
                            tab.content.html(status);
                        }
                    });
                },
                url: function(tab) {
                    return tab.target.attr('href');
                },
                show_tab: function() {
                    var tab_pricing_table = $('#tab_pricing_table');
                    MenuContent.show_tab(tab_pricing_table);
                    var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');
                    if(saved_anaysis_tab == 'tab_pricing_table') {
                        MenuContent.trigger({
                            'tab_id': saved_anaysis_tab
                        });
                    }
                },
                hide_tab: function() {
                    var tab_pricing_table = $('#tab_pricing_table');
                    MenuContent.hide_tab(tab_pricing_table);
                },
            };
        }(),
    };
}();
;BetAnalysis.DigitInfo = function() {
    this.chart_config = {
        chart: {
                renderTo:'last_digit_histo',
                defaultSeriesType:'column',
                backgroundColor:'#eee',
                borderWidth:1,
                borderColor:'#ccc',
                plotBackgroundColor:'#fff',
                plotBorderWidth:1,
                plotBorderColor:'#ccc',
                height:225 // This is "unresponsive", but so is leaving it empty where it goes to 400px.
        },
        title:{text:''},
        credits:{enabled:false},
        exporting:{enabled:false},
        legend:{
            enabled:false
        },
        tooltip:{
            borderWidth:1,
            formatter:function() {
                var that = this;
                var total = $("select[name='tick_count']").val();
                var percentage = that.y/total*100;
                return '<b>Digit:</b> '+ that.x +'<br/>'+
                '<b>Percentage:</b> '+ percentage.toFixed(1) + " %";
            }
        },
        plotOptions:{
            column:{
                shadow:false,
                borderWidth:0.5,
                borderColor:'#666',
                pointPadding:0,
                groupPadding:0,
                color: '#e1f0fb',
            },
            series: {
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        var total = $("select[name='tick_count']").val();
                        var percentage = this.point.y/total*100;
                        return percentage.toFixed(2) + ' %';
                    },
                },
            },
        },
        xAxis:{
            categories: ['0','1','2','3','4','5','6','7','8','9'],
            lineWidth:0,
            lineColor:'#999',
            tickLength:10,
            tickColor:'#ccc',
        },
        yAxis:{
            title:{text:''},
            maxPadding:0,
            gridLineColor:'#e9e9e9',
            tickWidth:1,
            tickLength:3,
            tickColor:'#ccc',
            lineColor:'#ccc',
            endOnTick:true,
            opposite: false,
            labels: {
                align: 'left',
                x: 0,
                enabled: false,
                formatter: function() {
                    var total = $("select[name='tick_count']").val();
                    var percentage = parseInt(this.value/total*100);
                    return percentage + " %";
                },
            },
        },
    };

    this.spots = [];
};

BetAnalysis.DigitInfo.prototype = {
    render: function(tab) {
        this.id = tab.id;
        var that = this;
        $.get(this.url(tab), function (texts) {
            tab.content.html(texts);
        }).done(function () {
            that.on_latest();
            that.show_chart(BetForm.attributes.underlying());
        });
    },
    url: function() {
        var existing_link = $('#tab_last_digit').find('a');
        var url = existing_link.attr('href').replace(/underlying=\w+/,'underlying='+ BetForm.attributes.underlying());
        existing_link.attr('href', url);
        return url;
    },
    on_latest: function() {
        var that = this;
        var tab = $('#' + this.id + "-content");
        var form = tab.find('form:first');
        form.on('submit', function(event) {
            event.preventDefault();
            return false;
        }).addClass('unbind_later');

        var get_latest = function() {
            var action = form.attr('action');
            $.ajax({
                url     : action,
                async   : true,
                data    : form.serialize(),
                success : function (texts) {
                    that.chart.destroy();
                    tab.html(texts);
                    that.on_latest();
                    var underlying = $('[name=underlying]', form).val();
                    that.show_chart(underlying);
                }
            });
        };
        $('[name=underlying]', form).on('change',  get_latest ).addClass('unbind_later');
        $('[name=tick_count]', form).on('change',  get_latest ).addClass('unbind_later');
    },
    show_chart: function(underlying) {
        this.chart_config.xAxis.title = {
            text: $('#last_digit_title').html(),
        };
        this.spots = $.parseJSON($('#last_digit_data').html());
        this.chart = new Highcharts.Chart(this.chart_config);
        this.chart.addSeries({name : underlying, data: []});

        this.update();
    },
    update: function(symbol, latest_spot) {
        if(typeof this.chart === "undefined") {
            return;
        }

        var series = this.chart.series[0]; // Where we put the final data.

        if (series.name != symbol) {
            latest_spot = undefined; // This simplifies the logic a bit later.
        }

        if (typeof latest_spot !== "undefined") { // This is a bit later. :D
            this.spots.unshift(latest_spot.slice(-1)); // Only last digit matters
            this.spots.pop();
        }

        // Always recompute and draw, even if theres no new data.
        // This is especially useful on first reuqest, but maybe in other ways.
        var filtered_spots = [];
        var digit = 10,
            filterFunc = function (el) { return el == digit; };
        var min_max_counter = [];
        while(digit--) {
            var val = this.spots.filter(filterFunc).length;
            filtered_spots[digit] = val;
            if (typeof min_max_counter[val] === 'undefined') {
                min_max_counter[val] = 0;
            }
            min_max_counter[val]++;
        }
        var min = Math.min.apply(null, filtered_spots);
        var max = Math.max.apply(null, filtered_spots);
        var min_index = filtered_spots.indexOf(min);
        var max_index = filtered_spots.indexOf(max);
        // changing color
        if (min_max_counter[min] === 1) {
            filtered_spots[min_index] = {y: min, color: '#CC0000'};
        }

        if (min_max_counter[max] === 1) {
            filtered_spots[max_index] = {y: max, color: '#2E8836'};
        }
        return series.setData(filtered_spots);
    },
    show_tab: function() {
        var tab_last_digit = $('#tab_last_digit');
        MenuContent.show_tab(tab_last_digit);
        var saved_anaysis_tab = SessionStore.get('bet_page.selected_analysis_tab');
        if(saved_anaysis_tab == 'tab_last_digit') {
            MenuContent.trigger({
                'tab_id': saved_anaysis_tab
            });
        }
    },
    hide_tab: function() {
        var tab_last_digit = $('#tab_last_digit');
        MenuContent.hide_tab(tab_last_digit);
        if(typeof this.chart !== "undefined") {
            this.chart.destroy();
        }
        this.chart = undefined;
        this.spots = [];
    }
};

BetAnalysis.tab_last_digit = new BetAnalysis.DigitInfo();
;BetAnalysis.tab_live_chart = function () {
    var live_chart_initialized = false;
    return {
        reset: function() {
            if(typeof live_chart !== "undefined") {
                if(live_chart !== null) {
                    live_chart.close_chart();
                    live_chart = null;
                }
            }
        },
        render: function(hours_to_chart) {
            if (live_chart_initialized && $('#live_chart_div').length > 0) {
                this.update_live_chart();
            } else {
                this.get_live_chart();
            }
        },
        get_live_chart: function() {
            var that = this;
            $.ajax(ajax_loggedin({
                url     : '/d/trade_livechart.cgi?l=' + page.language(),
                dataType: 'html',
                success : function (data) {
                            that.set_live_chart(data);
                          },
            }));
        },
        set_live_chart: function (data) {
            $('#trade_live_chart').html(data);
            var that = this;
            if(this.load_timer)
                return;

            showLoadingImage($('#live_chart_div'));
            //Waiting for Highcharts to get loaded.
            this.load_timer = setInterval(function(){
                if(typeof Highcharts !== "undefined") {
                    configure_livechart();
                    that.update_live_chart();
                    live_chart_initialized = true;
                    clearInterval(that.load_timer);
                    that.load_timer = undefined;
                }
            }, 80); //Its scientifically proven that humans cannot visualize what they see before 80ms.
        },
        update_live_chart: function () {
            if(this.update_chart_config()) {
                updateLiveChart(this.live_chart_config);
            }

            this.add_spot();
            var that = this;
            BetForm.barriers.each(function(barrier) { that.add_barrier(barrier); });
        },
        update_chart_config: function() {
            var symbol = BetForm.attributes.underlying();
            var live = SessionStore.get('live_chart_duration') || this.get_duration() || '10min';
            if(!this.live_chart_config) {
                this.live_chart_config = new LiveChartConfig({ renderTo: 'live_chart_div', symbol: symbol, live: live});
                return true;
            }

            var update = {};
            var update_config = false;
            if(this.live_chart_config.live != live) {
                update['live'] = live;
                update_config = true;
            }

            if(this.live_chart_config.symbol.symbol != symbol) {
                update['symbol'] = symbol;
                update_config = true;
            }

            if(update_config) {
                this.live_chart_config.update(update);
            }
            if (!live_chart) {
                update_config = true;
            }
            return update_config;
        },
        add_spot: function() {
            if(live_chart.config.has_indicator('spot')) {
                live_chart.remove_indicator('spot');
            }

            var barrier = new LiveChartIndicator.Barrier({ name: "spot", value: '+0', color: 'blue'});
            live_chart.add_indicator(barrier);
        },
        add_barrier: function(barrier) {
            if(live_chart.config.has_indicator(barrier.component_id)) {
                live_chart.remove_indicator(barrier.component_id);
            }

            barrier = new LiveChartIndicator.Barrier({ name: barrier.component_id, value: barrier.value(), color: 'green'});
            live_chart.add_indicator(barrier);
        },
        get_duration: function () {
            var duration_in_seconds = BetForm.attributes.duration_seconds();
            return $('#live_chart_duration').find('#' + this.corrected_hours_to_chart(duration_in_seconds)).data('live');
        },
        corrected_hours_to_chart: function(chart_duration) {
            var hours, available_hours = [];
            $('.live_charts_stream_button').each(function(){
                available_hours.push(parseInt($(this).attr("id")));
            });
            available_hours.sort(function(a,b) { return a - b; });
            for(hours in available_hours) {
                if(chart_duration <= available_hours[hours]) {
                    return available_hours[hours];
                }
            }
            return 1;
        },
        get_duration_seconds: function (selected_duration) {
           var duration;
           if (selected_duration) {
               duration = selected_duration.replace(/[a-zA-Z]/g, '');
               var duration_unit = selected_duration.replace(/\d+/g, '');

               if(duration_unit == 'min') {
                   return duration * 60;
               } else if(duration_unit == 'h') {
                   return duration * 3600;
               } else if(duration_unit == 'd') {
                   return duration * 86400;
               } else if(duration_unit == 'w') {
                   return duration * 604800;
               } else if(duration_unit == 'm') {
                   return duration * 2592000;
               } else if(duration_unit == 'y') {
                   return duration * 31536000;
               }
           }
           return duration;
        },
        live_chart_config: undefined,
        load_timer: undefined,
    };
}();
;var BetForm = function () {
    return {
        init: function() {
            this.time = (typeof this.time === 'undefined') ? new BetForm.Time() : this.time;
            this.barriers = (typeof this.barriers === 'undefined') ? new BetForm.Barriers() : this.barriers;
            this.actions.init();
            this.actions.register();
        },
        unregister_actions: function() {
            this.actions.unregister();
        },
        restore: function () {
            var bet_type_tab = this.attributes.model.form_name();

            showLoadingImage($('#betInputBox'));
            MenuContent.trigger({
                'tab_id': bet_type_tab
            });
        },
        update_content: function (data, event) {
            var betInputBox = $('#betInputBox');
            betInputBox.get(0).innerHTML = '<div class="toggle-content">' + data + '</div>';
        },
        bom_gmt_time: function() {
            return moment.utc(page.header.time_now);
        },
        error_message: function () {
            BetPrice.error_handler();
        },
        actions: function() {
            var tab_change_registered = false;
            var betform_request = null;
            return {
                init: function() {
                    this.on_bet_type_change();
                },
                register: function() {
                    $(BetForm.spot).on('change', function(event, spot) {
                        BetForm.barriers.spot_changed(spot);
                    });

                    $(BetForm.time).on('change', function(event, time) {
                        SessionStore.remove('live_chart_duration');
                        BetForm.barriers.time_changed(time);
                        BetPrice.container().hide();
                    });


                    $(BetForm.barriers).on('change', function(event, barrier) {
                        BetPrice.container().hide();
                        BetAnalysis.tab_live_chart.render();
                    });


                    var that = this;

                    var when_enter_pressed = function() {
                        //This is required to avoid key bounce causing 3 different enter pressed event
                        if(!that.propagating_enter_pressed) {
                            that.propagating_enter_pressed = setInterval(function(){
                                BetPrice.get_price();
                                clearInterval(that.propagating_enter_pressed);
                                that.propagating_enter_pressed = undefined;
                            }, 100);
                        }
                    };

                    BetForm.attributes.form().on('keydown', function(e) {
                        if(e.which == 13) {
                            when_enter_pressed();
                        }
                    });

                    $(BetForm.time).on('enter_pressed', when_enter_pressed);
                },
                unregister: function() {
                    BetForm.attributes.form().off('keydown');
                    $('#bet_underlying').off('change');
                    $('#submarket').off('change');
                    $('#bet_currency').off('change');
                    $('#atleast').off('change');
                    $(BetForm.spot).off('change');
                    $(BetForm.time).off('change');
                    $(BetForm.time).off('enter_pressed');
                    $(BetForm.barriers).off('change');

                    BetForm.time.unregister();
                    BetForm.barriers.unregister();
                    BetForm.attributes.form().off('submit');
                },
                on_bet_type_change: function() {
                    var that = this;
                    if(tab_change_registered) {
                        return;
                    }

                    tab_change_registered = true;
                    MenuContent.listen_click(function (info) {
                        if (info.menu.attr('id') == 'betsTab') {
                            if(BetForm.attributes.model.form_name() != info.id) {
                                BetForm.attributes.model.form_name(info.id);
                                //If we are already seeing a form, i.e. we are switching forms
                                if(typeof BetForm.attributes.form_name() !== "undefined") {
                                    page.url.invalidate();
                                }
                            }
                            that.get_form_by_name(info.id);
                            BetAnalysis.bet_type_changed();
                        }
                    });
                },
                get_form_by_name: function(form_name) {
                    if(betform_request) {
                        betform_request.abort();
                    }

                    var that = this;
                    betform_request = $.ajax({
                            url     : this.form_url(form_name),
                            success : function (data) {
                                    that.unregister();
                                    BetForm.update_content(data);
                                    betform_request = null;
                                    BetForm.underlying_drop_down.init();
                                    BetForm.attributes.restore.all();
                                    that.on_form_load();
                                },
                    }).fail( function ( jqXHR, textStatus ) {
                        BetForm.error_message();
                    });
                },
                get_form_by_underlying: function (underlying) {
                    if(betform_request) {
                        betform_request.abort();
                    }

                    var that = this;
                    betform_request = $.ajax({
                        url     : this.form_url('', underlying),
                        success : function (data) {
                            that.unregister();
                            BetForm.update_content(data);
                            betform_request = null;
                            BetForm.underlying_drop_down.init();
                            BetForm.attributes.restore.all_but_underlying();
                            that.on_form_load();
                        }
                    }).fail( function ( jqXHR, textStatus ) {
                        BetForm.error_message();
                    });
                },
                on_form_load: function() {
                    this.correct_selected_tab();
                    BetPrice.clear_buy_results();
                    BetForm.time.init();
                    BetForm.barriers.init();

                    BetForm.amount.update_calculation_value();

                    this.show_or_hide_analysis_tabs();

                    this.on_form_submit();
                    this.on_underlying_change();
                    this.on_submarket_change();
                    this.on_amount_change();
                    this.on_amount_type_change();
                    this.on_other_input_change();

                    $('#bet_calculate').focus(); //Focus on the Get Prices button.
                    this.hide_sub_trade();

                    this.register();
                    if(!BetForm.attributes.no_bets()) {
                        BetPrice.get_price();
                    }
                    BetAnalysis.restore();
                },
                hide_sub_trade: function () {
                    var sub_trade_menu = $('#betsTab').children().find('.tm-ul-2');
                    var len = sub_trade_menu.length;
                    for (var i=0; i<len; i++) {
                        var sub_menu_child = sub_trade_menu.eq(i).children();
                        if(sub_menu_child.length == 1) {
                            sub_menu_child.hide();
                        }
                    }
                },
                on_underlying_change: function () {
                    var that = this;
                    $('#bet_underlying').on('change', function (event) {
                        BetForm.attributes.model.underlying($(this).val());
                        that.update_for_underlying($(this).val());
                    }).addClass('unbind_later');
                },
                on_submarket_change: function () {
                    var that = this;
                    $('#submarket').on('change', function (event) {
                        BetForm.attributes.model.submarket(this.value);
                        BetForm.underlying_drop_down.update_for_submarket(this.value);
                        //If Underlying Changed because of submarket
                        if (BetForm.attributes.model.underlying() != BetForm.attributes.underlying()) {
                            BetForm.attributes.model.underlying(BetForm.attributes.underlying());
                            that.update_for_underlying(BetForm.attributes.underlying());
                        }
                    }).addClass('unbind_later');
                },
                update_for_underlying: function (underlying_symbol) {
                    BetPrice.streaming.stop();
                    BetForm.spot.clear();
                    this.get_form_by_underlying(underlying_symbol);
                    BetAnalysis.underlying_changed();
                },
                on_other_input_change: function () {
                    $('#bet_currency').on('change', function (event) {
                        BetForm.attributes.model.currency(this.value);
                        $('#bet_calculation_container').hide();
                    }).addClass('unbind_later');
                    $('#atleast').on('change', function () {
                        var selected = this.value;
                        BetForm.attributes.model.start_time(selected);
                        BetForm.time.update_for_start_time_change();
                        $('#bet_calculation_container').hide();
                    }).addClass('unbind_later');
                },
                on_form_submit: function() {
                    BetForm.attributes.form().on('submit', function (event) {
                        event.preventDefault();
                        BetPrice.clear_buy_results();
                        BetPrice.get_price();
                    }).addClass('unbind_later');
                },
                show_or_hide_analysis_tabs: function() {
                    if(BetForm.attributes.show_ohlc()) {
                        BetAnalysis.tab_ohlc.show_tab();
                    } else {
                        BetAnalysis.tab_ohlc.hide_tab();
                        if(BetAnalysis.was_showing_tab('tab_ohlc')) {
                            BetAnalysis.show_tab(); //If the user was here, show him something else.
                        }
                    }

                    var analysis_tab = BetForm.attributes.extratab();
                    if(analysis_tab == 'pricing_table') {
                        // We should show exactly one of these
                        BetAnalysis.tab_pricing_table.show_tab();
                        BetAnalysis.tab_intradayprices.hide_tab();
                        BetAnalysis.tab_last_digit.hide_tab();
                        if (BetAnalysis.was_showing_tab('tab_intradayprices') ||
                            BetAnalysis.was_showing_tab('tab_last_digit')) {
                            BetAnalysis.show_tab('tab_pricing_table');
                        }
                    } else if(analysis_tab == 'last_digit') {
                        // We should show exactly one of these
                        BetAnalysis.tab_last_digit.show_tab();
                        BetAnalysis.tab_pricing_table.hide_tab();
                        BetAnalysis.tab_intradayprices.hide_tab();
                        if (BetAnalysis.was_showing_tab('tab_intradayprices') ||
                            BetAnalysis.was_showing_tab('tab_pricing_table')) {
                            BetAnalysis.show_tab('tab_last_digit');
                        }
                    } else if(analysis_tab == 'intradayprices') {
                        // We should show exactly one of these
                        BetAnalysis.tab_intradayprices.show_tab();
                        BetAnalysis.tab_pricing_table.hide_tab();
                        BetAnalysis.tab_last_digit.hide_tab();
                        if (BetAnalysis.was_showing_tab('tab_last_digit') ||
                            BetAnalysis.was_showing_tab('tab_pricing_table')) {
                            BetAnalysis.show_tab('tab_intradayprices');
                        }
                    } else {
                        // Hide them all if none selected
                        MenuContent.hide_tab($('#tab_intradayprices'));
                        MenuContent.hide_tab($('#tab_pricing_table'));
                        MenuContent.hide_tab($('#tab_last_digit'));
                        MenuContent.trigger({'tab_id': 'tab_explanation'});
                    }
                },
                on_amount_change: function() {
                    BetPrice.clear_buy_results();
                    $('input#amount', BetForm.attributes.form_selector()).on('keyup', BetForm.amount.keyup).addClass('unbind_later');
                    $('input#amount', BetForm.attributes.form_selector()).on('change', BetForm.amount.lost_focus).addClass('unbind_later');
                },
                on_amount_type_change: function() {
                    //Force recalculate minimumss and update price boxes
                    $('#amount_type').on('change', function() {
                        BetForm.amount.lost_focus();
                        BetForm.attributes.model.amount_type(this.value);
                    }).addClass('unbind_later');
                },
                correct_selected_tab: function() {
                    //Wrong tab selected? Select the right one.
                    //Whe wrong tab? Caching, we build the frame before we build the form and sometimes there is no formname attribute in the url.
                    var form_name = BetForm.attributes.form_name();
                    if($('#bets_tab_' + form_name).length > 0 && $('#bets_tab_' + form_name + '.active.tm-li').length === 0) {
                        $('#betsTab .active.tm-li').removeClass('active');
                        $('#bets_tab_' + form_name + '.tm-li').addClass('active');
                    }
                },
                form_url: function (form_name, underlying_symbol) {
                    var params = 'controller_action=bet_form';
                    var market = BetForm.attributes.model.market();
                    if(market != 'null') {
                        params += '&market=' + market;
                    }

                    form_name = form_name ? form_name : BetForm.attributes.model.form_name();
                    if (form_name) {
                        params += '&form_name=' + form_name;
                    }


                    underlying_symbol = underlying_symbol || BetForm.attributes.model.underlying();
                    if (underlying_symbol && markets.by_symbol(underlying_symbol).market.name == market) {
                        params += '&underlying_symbol=' + underlying_symbol;
                    }

                    var time = BetForm.attributes.model.time();
                    if(time) {
                        params += '&time=' + time;
                    }

                    var barrier_1 = BetForm.attributes.model.barrier_1();
                    if(barrier_1) {
                        params += '&H=' + barrier_1;
                    }

                    var barrier_2 = BetForm.attributes.model.barrier_2();
                    if(barrier_2) {
                        params += '&L=' + barrier_2;
                    }

                    var date_start = BetForm.attributes.model.start_time();
                    if(date_start) {
                        params += '&date_start=' + date_start;
                    }

                    var type = page.url.param_if_valid('type');
                    if(type) {
                        params += '&type=' + type;
                    }

                    var expiry_type = BetForm.attributes.model.expiry_type();
                    if (expiry_type) {
                        params += '&expiry_type=' + expiry_type;
                    }

                    return page.url.url_for('trade_get.cgi', params);
               },
                disable: function (elements) {
                    var form_ = $(BetForm.attributes.form_selector());
                    form_.find('input[type="submit"]').each(function () {this.disabled = true;});
                    form_.find('button[type="submit"]').each(function () {this.disabled = true;});
                    if (elements) {
                        form_.find('input').each(function () {this.disabled = true;});
                        form_.find('select').each(function () {this.disabled = true;});
                        form_.find('textarea').each(function () {this.disabled = true;});
                        form_.find('button').each(function () {this.disabled = true;});
                    }
                },
                enable: function (elements) {
                    var form_ = $(BetForm.attributes.form_selector());
                    form_.find('input[type="submit"]').each(function () {this.disabled = false;});
                    form_.find('button[type="submit"]').each(function () {this.disabled = false;});
                    if (elements) {
                        form_.find('input').each(function () {this.disabled = false;});
                        form_.find('select').each(function () {this.disabled = false;});
                        form_.find('textarea').each(function () {this.disabled = false;});
                        form_.find('button').each(function () {this.disabled = false;});
                    }
                },
            };
        }(),
        spot: function() {
            var spots = [];
            return {
                update: function(spot) {
                    spots.push(spot);
                    if (spots.length >= 30) {
                        spots.shift();
                    }

                    this.show_spot(spot);
                    $('#spot_spark').sparkline(spots, this.spark_line_config);

                    $(this).trigger('change', [ spot ]);
                },
                show_spot: function(spot) {
                    var spot_container = $('#spot');
                    if(spot && parseFloat(spot) == spot) {
                        var pre_spot = spot;

                        var pre_spot_text = spot_container.text();
                        if (pre_spot_text) {
                            pre_spot = parseFloat(pre_spot_text);
                        }

                        price_moved(spot_container, pre_spot, spot);
                    }
                    spot_container.html(spot);
                },
                clear: function() {
                    this.clear_sparkline();
                    this.show_spot('');
                },
                clear_sparkline: function () {
                    spots = [];
                    $('#spot_spark').sparkline(spots, this.spark_line_config);
                },
                value: function() {
                    return parseFloat(spots[spots.length - 1]);
                },
                spark_line_config: {
                    type: 'line',
                    lineColor: '#606060',
                    fillColor: false,
                    spotColor: '#00f000',
                    minSpotColor: '#f00000',
                    maxSpotColor: '#0000f0',
                    highlightSpotColor: '#ffff00',
                    highlightLineColor: '#000000',
                    spotRadius: 1.25
                },
            };
        }(),
        underlying_drop_down: function() {
            var underlyings_info = [];
            return {
                init: function() {
                    underlyings_info = [];
                    $('#bet_underlying > option').each(function(){
                        var underlying = {};
                        underlying.className = $(this).attr('class');
                        underlying.value = $(this).val();
                        underlying.label = $(this).text();
                        underlyings_info.push(underlying);
                    });
                },
                has: function(underlying_symbol) {
                    for ( var index in underlyings_info ) {
                        if(underlyings_info[index].value == underlying_symbol) {
                            return true;
                        }
                    }

                    return false;
                },
                update_for_submarket: function (submarket) {
                    var index;

                    if (submarket) {
                        var old_value = $('#bet_underlying').val();
                        this.clear();
                        if ( submarket == 'all' ) {
                            var len = underlyings_info.length;
                            for ( index = 0; index < len; index++ ) {
                                this.add(underlyings_info[index]);
                            }
                        } else {
                            var regex_sub_market = new RegExp('\\b'+submarket+'\\b');
                            for ( index in underlyings_info ) {
                                if ( regex_sub_market.test(underlyings_info[index].className) ) {
                                    this.add(underlyings_info[index]);
                                }
                            }
                        }

                        //If nothing was selected try to select the default from backend.
                        if($('#bet_underlying').val() === null) {
                            $('#bet_underlying').val(old_value);
                        }
                    }

                    //If nothing was sent selected by the backend then select the first one.
                    if($('#bet_underlying').val() === null) {
                        $('#bet_underlying').val($('#bet_underlying option:eq(0)').val());
                    }
                },
                clear: function() {
                    $('#bet_underlying option').remove();
                },
                add: function(underlying_info) {
                    var option = this.create_option(underlying_info);
                    var drop_down = document.getElementById("bet_underlying");
                    try {
                        // for IE version less than 8
                        drop_down.add(option, drop_down.options[null]);
                    } catch (e) {
                        drop_down.add(option, null);
                    }
                },
                create_option: function(underlying_info) {
                    var selected_underlying = BetForm.attributes.model.underlying();
                    var option = document.createElement("option");

                    option.className = underlying_info.className;
                    option.value = underlying_info.value;

                    if ( selected_underlying && selected_underlying == underlying_info.value) {
                        option.selected = "selected";
                    }

                    option.text = underlying_info.label;

                    return option;
                }
            };
        }(),
        amount: function() {
            return {
                payout_min:    1,
                payout_max:    100000,
                payout_err:    undefined,
                stake_min:    0.5,
                stake_max:    100000,
                stake_err:    undefined,
                calculation_value: undefined,
                keyup: function(event) {
                    var me = BetForm.amount;
                    me.update_calculation_value();
                    BetForm.attributes.model.amount(me.calculation_value);
                    BetPrice.order_form.update();
                    //No need to panic unless the user actually entered a ','(188).
                    if(event.keyCode == 188) {
                        var amount = $(this).val();
                        $(this).val(amount.replace(',', '.'));
                    }
                },
                lost_focus: function(event) {
                    var me = BetForm.amount;
                    me.update_calculation_value();
                    BetForm.attributes.model.amount(me.calculation_value);
                    BetPrice.order_form.update();
                    $('#amount').val(me.calculation_value);
                },
                update_calculation_value: function() {
                    var amount = BetForm.attributes.amount();
                    if ( this.valid(amount) ) {
                        this.calculation_value = amount;
                    }
                },
                valid: function(amount) {
                    if (isNaN(amount)) {
                        return false;
                    }
                    return true;
                },
                update_settings: function() {
                    this.stake_min = parseFloat($('#staking_context #stake_min').html());
                    this.stake_max = parseFloat($('#staking_context #stake_max').html());
                    this.stake_err = $('#staking_context #stake_err').html();
                    this.payout_min = parseFloat($('#staking_context #payout_min').html());
                    this.payout_max = parseFloat($('#staking_context #payout_max').html());
                    this.payout_err = $('#staking_context #payout_err').html();
                },
            };
        }(),
    };
}();
;BetForm.attributes = function() {
    var selected_settings = {};
    return {
            form: function() {
                return $('form[name=form0]');
            },
            expiry_type: function() {
                return $('[name=expiry_type]', this.form_selector()).val();
            },
            expiry_time: function() {
                return $('[name=expiry_time]', this.form_selector()).val();
            },
            expiry_date: function() {
                return $('[name=expiry_date]', this.form_selector()).val();
            },
            no_bets: function() {
                return ($('#no_bets').length > 0);
            },
            form_selector: function() {
                return $('form[name=form0]').get(0);
            },
            form_name: function() {
                return $('[name=form_name]', this.form_selector()).val();
            },
            bet_type: function() {
                return LocalStore.get('bet_page.form_name');
            },
            prediction: function() {
                return $('[name=prediction]', this.form_selector()).val();
            },
            market: function() {
                return $('[name=market]', this.form_selector()).val();
            },
            submarket: function() {
                return $('[name=submarket]', this.form_selector()).val();
            },
            underlying: function() {
                return $('#bet_underlying', this.form_selector()).val();
            },
            underlying_text: function() {
                return $('#bet_underlying option:selected', this.form_selector()).text();
            },
            spot: function() {
                return $('[name=S]', this.form_selector()).val();
            },
            start_time: function() {
                return $('[name=date_start]', this.form_selector()).val();
            },
            start_time_moment: function() {
                var start_time = this.start_time();
                var now = moment.utc(BetForm.bom_gmt_time());
                if (typeof start_time !== 'undefined' && start_time !== 'now') {
                    now = moment.utc(start_time*1000);
                }

                return now;
            },
            barrier_1: function() {
                return $('#bet_H', this.form_selector()).val();
            },
            barrier_2: function() {
                return $('#bet_L', this.form_selector()).val();
            },
            pip_size: function() {
                return $('[name=pip_size]', this.form_selector()).val();
            },
            barrier_type: function() {
                var barriers = $('[name=H]', this.form_selector()).length + $('[name=L]', this.form_selector()).length;
                if(barriers > 0) {
                    return $('[name=barrier_type]', this.form_selector()).val();
                }
                return;
            },
            duration_container: function() {
                return $('#duration_container', this.form_selector());
            },
            duration_amount: function() {
                return $('#duration_amount', this.form_selector()).val();
            },
            duration_units: function() {
                return $('[name=duration_units]', this.form_selector()).val();
            },
            duration_seconds: function() {
                var duration = parseInt(parseFloat(this.duration_amount()));
                var duration_units = this.duration_units();

                if(duration_units == 'm') {
                    return duration * 60;
                } else if(duration_units == 'h') {
                    return duration * 3600;
                } else if(duration_units == 'd') {
                    return duration * 86400;
                }

                return duration;
            },
            duration_string: function() {
                return this.duration_amount() + this.duration_units();
            },
            minimum_duration_for: function(unit) {
                var duration_container = this.duration_container();
                var minimums = duration_container.find('.' + unit);
                if(minimums.html()) {
                    return parseInt(parseFloat(minimums.html().split(':')[1]));
                }

                return;
            },
            currency: function() {
                return $('[name=currency]', this.form_selector()).val();
            },
            amount: function() {
                var amount_str =  $('#amount', BetForm.attributes.form_selector()).val();
                if(amount_str) {
                    amount_str = amount_str.replace(',', '.');
                    amount_str = amount_str.replace(/[^\d\.]/g, '');
                }
                var amount_f = parseFloat(amount_str);
                var amount = 0;
                if (!isNaN(amount_f) && amount_f > 0) {
                    // only keep the first 2 digits of the floating value, and only 2
                    amount_f = Math.round(amount_f * 100) / 100;
                    var amount_int = Math.floor(amount_f);
                    var float_val = amount_f - amount_int;
                    if (float_val) {
                        amount = amount_f.toFixed(2);
                    } else {
                        amount = amount_int;
                    }
                }
                return amount;
            },
            is_amount_payout: function() {
                return ($('#amount_type').val() == "payout");
            },
            is_amount_stake: function() {
                return ($('#amount_type').val() == "stake");
            },
            amount_type: function() {
                return $('#amount_type', this.form_selector()).val();
            },
            show_ohlc: function() {
                return ($('input[name="showohlc"]', this.form_selector()).val() == "yes");
            },
            extratab: function() {
                return ($('input[name="extratab"]', this.form_selector()).val());
            },
            is_forward_starting: function() {
                return (this.start_time() && this.start_time().match(/^\d+$/));
            },
            can_select: function (selector, value) {
                if ($('#'+selector+' option[value="'+value+'"]').length > 0) {
                    return true;
                } else {
                    return false;
                }
            },
            model: function() {
                return {
                    form_name: function(form_name) {
                        var fallback = 'bets_tab_callput';
                        if(form_name) {
                            LocalStore.set('bet_page.form_name', form_name);
                        }

                        form_name = this.get_setting_or_param('bet_page.form_name', 'form_name') || fallback;
                        if(!$('#' + form_name).length) {
                            form_name = fallback;
                        }

                        return form_name;
                    },
                    market: function() {
                        var market = page.url.param_if_valid('market');
                        if (market) {
                            LocalStore.set('bet_page.market', market);
                        }
                        return page.url.param_if_valid('market') || LocalStore.get('bet_page.market') || 'forex';
                    },
                    underlying: function(underlying) {
                        var for_market = this.market();
                        if(underlying) {
                            for_market = markets.by_symbol(underlying).market.name;
                            LocalStore.set('bet_page.underlying.'+for_market, underlying);
                            page.url.invalidate();
                        }

                        return page.url.param_if_valid('underlying_symbol') || LocalStore.get('bet_page.underlying.'+for_market);
                    },
                    submarket: function(submarket) {
                        if(submarket) {
                            LocalStore.set('bet_page.submarket', submarket);
                            page.url.invalidate();
                        }

                        return LocalStore.get('bet_page.submarket');
                    },
                    start_time: function(start_time) {
                        if(start_time) {
                            LocalStore.set('bet_page.start_time', start_time);
                            page.url.invalidate();
                        }

                        return this.get_setting_or_param('bet_page.start_time', 'date_start');
                    },
                    expiry_type: function(expiry_type) {
                        if (expiry_type) {
                            LocalStore.set('bet_page.expiry_type', expiry_type);
                            page.url.invalidate();
                        }

                        return page.url.param_if_valid('expiry_type') || LocalStore.get('bet_page.expiry_type') || 'duration';
                    },
                    time: function(time) {
                        if(time) {
                            LocalStore.set('bet_page.time', time);
                            page.url.invalidate();
                        }

                        return this.get_setting_or_param("bet_page.time", 'time');
                    },
                    barrier_1: function() {
                        return page.url.param_if_valid('H');
                    },
                    barrier_2: function() {
                        return page.url.param_if_valid('L');
                    },
                    amount: function(amount) {
                        if(amount) {
                            LocalStore.set('bet_page.amount', amount);
                            page.url.invalidate();
                        }

                        return this.get_setting_or_param("bet_page.amount", 'amount');
                    },
                    amount_type: function(amount_type) {
                        if(amount_type) {
                            LocalStore.set('bet_page.amount_type', amount_type);
                            page.url.invalidate();
                        }

                        return this.get_setting_or_param("bet_page.amount_type", 'amount_type');
                    },
                    currency: function(currency) {
                        if(currency) {
                            LocalStore.set('bet_page.currency', currency);
                            page.url.invalidate();
                        }

                        var url_currency = page.url.param_if_valid('currency');
                        if(url_currency) {
                            return url_currency;
                        }

                        var session_currency = LocalStore.get('bet_page.currency');
                        if(session_currency) {
                            return session_currency;
                        }

                        return;
                    },
                    get_setting_or_param: function(setting_name, param_name) {
                        var saved_param = LocalStore.get(setting_name);
                        var url_param = page.url.param_if_valid(param_name);

                        //Only take the url provided param if its valid.
                        if(url_param) {
                            return url_param;
                        }

                        return saved_param;
                    },
                };
            }(),
            restore: function() {
                return {
                    all: function() {
                        this.submarket();
                        this.underlying();
                        this.amount();
                        this.amount_type();
                        this.currency();
                    },
                    all_but_underlying: function() {
                        this.submarket();
                        this.amount();
                        this.amount_type();
                        this.currency();
                    },
                    underlying: function() {
                        var underlying = BetForm.attributes.model.underlying();
                        var market = BetForm.attributes.model.market();
                        if(underlying && BetForm.attributes.can_select('bet_underlying', underlying)) {
                            $('#bet_underlying', BetForm.attributes.form_selector()).val(underlying);
                        }
                    },
                    submarket: function() {
                        var market = BetForm.attributes.model.market();
                        var submarket = BetForm.attributes.model.submarket();
                        if(submarket && BetForm.attributes.can_select('submarket', submarket)) {
                            $('#submarket', BetForm.attributes.form_selector()).val(submarket);
                            BetForm.underlying_drop_down.update_for_submarket(submarket);
                        }
                    },
                    amount: function() {
                        var amount = BetForm.attributes.model.amount();
                        if(amount) {
                            $('#amount', BetForm.attributes.form_selector()).val(amount);
                        }
                    },
                    amount_type: function() {
                        var amount_type = BetForm.attributes.model.amount_type();
                        if(amount_type) {
                            $('#amount_type', BetForm.attributes.form_selector()).val(amount_type);
                        }
                    },
                    currency: function() {
                        if(page.client.is_logged_in) {
                            var client_currencies = Settings.get('client.currencies');
                            if(client_currencies !== 'undefined'  && client_currencies.length > 0) {
                                $('#bet_currency option').each(function() {
                                    if($.inArray($(this).val(), client_currencies) < 0) {
                                        $(this).remove();
                                    }
                                });
                            }
                        }

                        var currency = BetForm.attributes.model.currency();
                        if(currency && BetForm.attributes.can_select('bet_currency', currency)) {
                            $('#bet_currency').val(currency);
                        }
                    },
                };

            }()
    };
}();
;BetForm.Barriers = function() {
    this.defaults = {};
    this.barriers = [];
};

BetForm.Barriers.prototype = {
    register: function() {
        var that = this;
        this.each(function(barrier) {
            barrier.register();
            $(barrier).on('change', function(event, value) {
                $(that).trigger('change', [ value ]);
            });
        });
    },
    unregister: function() {
        this.each(function(barrier) {
            barrier.unregister();
            $(barrier).off('change');
        });
    },
    spot_changed: function(spot) {
        this.each(function(barrier) { barrier.update_calclulated_value(barrier.value()); });
    },
    time_changed: function(end_time) {
        var current_barrier_type = BetForm.attributes.barrier_type();
        if(!moment.utc().isSame(moment.utc(end_time), 'day')) {
            if(current_barrier_type == 'relative') {
                this.switch_to('absolute');
            }
        } else if (current_barrier_type == 'absolute' && page.settings.get('enable_relative_barrier')) {
            this.switch_to('relative');
        }
    },
    init: function() {
        this.barriers = [];
        var barrier,
            barrier_type = BetForm.attributes.barrier_type();
        if($('#bet_H').length > 0) {
            barrier = new BetForm.Barriers.Barrier({
                    component_id: 'bet_H',
                    calculated_barrier_id: 'betInputBox span.calculated_barrier_from_relative_high',
                    barrier_type: barrier_type,
            });

            barrier.value(this.select_barrier_value(BetForm.attributes.barrier_1(), 'H'));
            this.barriers.push(barrier);
        }

        if($('#bet_L').length > 0) {
            barrier = new BetForm.Barriers.Barrier({
                    component_id: 'bet_L',
                    calculated_barrier_id: 'betInputBox span.calculated_barrier_from_relative_low',
                    barrier_type: barrier_type,
            });
            barrier.value(this.select_barrier_value(BetForm.attributes.barrier_2(), 'L'));
            this.barriers.push(barrier);
        }

        this.register();
    },
    select_barrier_value: function(model_value, default_type) {
        var barrier_value;
        var is_valid_barrier = function(value) {
            return true;
        };

        if(is_valid_barrier(model_value)) {
            return model_value;
        }

        var defaults = this.get_defaults_for(BetForm.attributes.barrier_type());
        if(defaults && is_valid_barrier(defaults[default_type])) {
            return defaults[default_type];
        }

        return 0;
    },
    switch_to: function(barrier_type) {
        if(barrier_type == 'absolute') {
            $('.barrier_text_absolute').show();
            $('.barrier_text_relative').hide();
            $('[name=barrier_type]', BetForm.attributes.form_selector()).val('absolute');
            this.each(function(barrier) { barrier.switch_to('absolute'); });
        } else if(barrier_type == 'relative') {
            $('.barrier_text_absolute').hide();
            $('.barrier_text_relative').show();
            $('[name=barrier_type]', BetForm.attributes.form_selector()).val('relative');
            this.each(function(barrier) { barrier.switch_to('relative'); });
        }
    },
    each: function(method) {
        var rets = [];
        var barriers_count = this.barriers.length - 1;
        while(barriers_count >= 0) {
            rets.push(method(this.barriers[barriers_count]));
            barriers_count--;
        }

        return rets;
    },
    get_defaults_for: function(barrierType) {
        var that = this;
        var underlying = BetForm.attributes.underlying();
        market = BetForm.attributes.market();
        time = BetForm.attributes.duration_string();
        form_name = BetForm.attributes.form_name();
        prediction = BetForm.attributes.prediction();

        var lookup = underlying + '_' +  time + '_' + form_name + '_' + prediction;
        if(typeof this.defaults[lookup] === 'undefined') {
            $.ajax({
                url: page.url.url_for('trade_get.cgi'),
                data: {
                    controller_action: 'barrier_defaults',
                    underlying_symbol: underlying,
                    market: market,
                    time: time,
                    form_name: form_name,
                    barrier_type: barrierType,
                },
                dataType: 'json',
                type: 'GET',
                async: false,
            }).done(function(ranges) {
                that.defaults[lookup] = ranges;
            });
        }

        return this.defaults[lookup];
    },
};

BetForm.Barriers.Barrier = function(args) {
    args = (typeof args === 'undefined') ? {} : args;
    this.component_id = args.component_id;
    this.calculated_barrier_id = args.calculated_barrier_id;
    this.barrier_type = args.barrier_type;
};

BetForm.Barriers.Barrier.prototype = {
    register: function() {
        this.on_change();
        this.on_keyup();
    },
    unregister: function() {
        $('#' + this.component_id).off('keyup');
        $('#' + this.component_id).off('change');
    },
    value: function(value) {
        if(typeof value !== 'undefined') {
            var barrier_prefix = "";
            if (BetForm.attributes.form_name() != 'digits') {
                if(this.barrier_type == 'relative') {
                    if(value > 0) {
                        barrier_prefix = "+";
                    } else if(value === 0) {
                        barrier_prefix = "+";
                        value = this.min_value();
                    }
                } else {
                    if(value < 0) {
                        value = BetForm.spot.value();
                    } else if(value === 0) {
                        value = this.to_absolute_value(this.min_value());
                    }
                }
                value = this.pipsized_value(value);
            }

            $('#' + this.component_id).val(barrier_prefix + value);

            this.update_calclulated_value(value);
            $(this).trigger('change', [ barrier_prefix + value ]);
        }

        return $('#' + this.component_id).val();
    },
    switch_to: function(barrier_type) {
        this.barrier_type = barrier_type;
        var value = $('#' + this.component_id).val();
        if(barrier_type == 'absolute') {
            this.value(this.to_absolute_value(value));
            $('#' + this.calculated_barrier_id).hide();
        } else if(barrier_type == 'relative') {
            this.value(this.to_relative_value(value));
            $('#' + this.calculated_barrier_id).show();
        }
    },
    update_calclulated_value: function(value) {
        if(this.barrier_type == 'relative') {
            value = this.pipsized_value(this.to_absolute_value(value));
            $('#' + this.calculated_barrier_id).html("(" + value + ")");
        }
    },
    on_change: function() {
        var that = this;
        $('#' + this.component_id).on('change', function(event) {
            var value = $(this).val();
            if(value.length > 0) {
                that.value(value);
            }
        }).addClass('unbind_later');
    },
    on_keyup: function() {
        var that = this;
        $('#' + this.component_id).on('keyup', function(event) {
            var value = $(this).val();
            if(value.length > 0) {
                that.update_calclulated_value(value);
            }
        }).addClass('unbind_later');
    },
    pipsized_value: function(value) {
        var pip_size = BetForm.attributes.pip_size();
        return parseFloat(value).toFixed(pip_size);
    },
    to_relative_value: function(barrier) {
        var spot = BetForm.spot.value();
        if(spot > 0) {
            return this.pipsized_value(parseFloat(barrier) - spot);
        }

        return 0.00;
    },
    to_absolute_value: function(barrier) {
        var spot = BetForm.spot.value();
        if(spot > 0) {
            return this.pipsized_value(parseFloat(barrier) + spot);
        }

        return 0.00;
    },
    min_value: function() {
        if(typeof this.min_relative_value === 'undefined') {
            var pip_size = BetForm.attributes.pip_size();
            var value = "0.";
            var zeros = pip_size - 1;
            while(zeros > 0) {
                value += 0;
                zeros--;
            }
            value += 1;
            this.min_relative_value = value;
        }

        if(this.barrier_type == "absolute") {
            return this.to_absolute_value(this.min_relative_value);
        }

        return this.min_relative_value;
    },
};
;/*
 * Represents the overall time selection ui(duration & end time)
*/
BetForm.Time = function() {
    this.model = {};
    this.model.expiry_type = BetForm.attributes.model.expiry_type();
    this.trading_time = new BetForm.TradingTime();
    this.duration = new BetForm.Time.Duration(this.trading_time);
    this.end_time = new BetForm.Time.EndTime(this.trading_time);
};

BetForm.Time.prototype = {
    init: function() {
        this.trading_time.init();
        this.duration.init();
        this.end_time.init();
        this.register();
        if (BetForm.attributes.model.form_name() == "digits" || BetForm.attributes.model.form_name() == "asian") {
            var expiry_val = 'duration';
            $('#expiry_type').val(expiry_val);
            page.url.invalidate();
            LocalStore.set('bet_page.expiry_type', expiry_val);
            BetForm.attributes.model.expiry_type(expiry_val);
            this.model.expiry_type = expiry_val;
            $('#duration_amount').val(this.trading_time.min_unit().min);
        } else {
            $('#expiry_type').val(this.model.expiry_type);
        }
        this.update_ui();
    },
    register: function() {
        this.on_expiry_type_change();
        this.duration.register();
        this.end_time.register();

        var that = this;
        $(this.duration).on('change', function(event, time) {
            $(that).trigger('change', [ time ]);
        });

        $(this.end_time).on('change', function(event, time) {
            $(that).trigger('change', [ time ]);
        });

        $(this.duration).on('enter_pressed', function() {
            $(that).trigger('enter_pressed');
        });

        $(this.end_time).on('enter_pressed', function() {
            $(that).trigger('enter_pressed');
        });
    },
    unregister: function() {
        $('#expiry_type').off('change');
        if(this.duration) {
            this.duration.unregister();
        }

        if(this.end_time) {
            this.end_time.unregister();
        }

        $(this.duration).off('change');
        $(this.end_time).off('change');

        $(this.duration).off('enter_pressed');
        $(this.end_time).off('enter_pressed');
    },
    update_for_start_time_change: function() {
        this.duration.update_units_select();
        this.duration.update_ui();
        this.end_time.update_ui();
    },
    update_ui: function() {
        if(this.model.expiry_type == 'duration') {
            this.duration.show();
            this.end_time.hide();
        } else {
            this.duration.hide();
            this.end_time.show();
        }
    },
    on_expiry_type_change: function() {
        var that = this;
        $('#expiry_type').on('change', function() {
            BetForm.attributes.model.expiry_type($(this).val());
            that.model.expiry_type = $(this).val();
            that.update_ui();
        }).addClass('unbind_later');
    },
};

/*
 * This object acts as a model for time parameter. It performs the following functions.
 *      - Read and interpret the time parameter from model(input / localstore).
 *              - The data can be interpretted in both duration format and end time format independent of underlying storage.
 *      - Provide a meachanism to parse and query the minimum durations passed through the form.
 *      - Provide functions to query trading_days and trading_times from the server.
 *      - Validate the time parameter
 *              - through the minimum durations passed to us through the form.
 *              - by querying on trading_days and trading_times from the server.
 *      - Provide mechanism to update the time model.
*/
BetForm.TradingTime = function() {
    this.time_is_duration_regex = /^\d+[smhd]$/;
    this.time_is_tick_regex = /^\d+t$/;
    this.trading_info = {};
};

BetForm.TradingTime.prototype = {
    init: function() {
        this.suggested_duration = this.virgule_duration("" + $('#duration_amount').val() + $('#duration_units').val());
        this.parse_units_from_form();
    },
    value: function(time) {
        if(time) {
            BetForm.attributes.model.time(time);
        }

        time = BetForm.attributes.model.time();
        if(time) {
            return time;
        }

        
        //If we are not able to find something in the model(param/stored) 
        //then we just use the value in duration as defaults.
        //This is becuase only duration comes populated.
        return "" + $('#duration_amount').val() + $('#duration_units').val();
    },
    underlying: function() {
        return BetForm.attributes.underlying();
    },
    is_forward_starting: function() {
        return BetForm.attributes.is_forward_starting();
    },
    as_duration: function() {
        var time = this.value();
        var duration;
        if(this.time_is_tick(time)) {
            duration = this.virgule_duration(time);
        } else if(this.time_is_duration(time)) {
            duration = this.virgule_duration(time);
        } else if(isNaN(parseInt(time))) {
            duration = this.suggested_duration;
        } else {
            duration = this.convert_to_duration(time);
        }

        //Validate the duration
        var selected_unit = this.configured_unit_for(duration.units);

        if(!selected_unit) {
            var min_unit = this.min_unit();
            duration.amount = min_unit.min;
            duration.units = min_unit.units;
        }

        return duration;
    },
    as_end_time: function() {
        var time = this.value();
        var end_time;
        if(this.time_is_duration(time)) {
            var duration = this.virgule_duration(time);
            end_time = this.convert_to_end_time(duration.amount, duration.units);
        } else if(isNaN(parseInt(time))) {
            end_time = this.convert_to_end_time(this.suggested_duration);
        } else {
            end_time = this.virgule_end_time(time);
        }

        //Validate the end_time
        var min_time = this.min_time();
        if(end_time.moment.isBefore(min_time)) {
            end_time = this.virgule_end_time(min_time.utc() / 1000);
        }

        var max_time = this.max_time();
        if(end_time.moment.isAfter(max_time)) {
            end_time = this.virgule_end_time(min_time.utc() / 1000);
        }

        return end_time;
    },
    update_from_duration: function(amount, unit) {
        var selected_unit = this.configured_unit_for(unit);

        this.value("" + amount + unit);
    },
    update_from_end_time: function(expiry_date, expiry_time) {
        var end_time = moment.utc(expiry_date + " " + expiry_time);
        var min_time = this.min_time();
        if(end_time.isBefore(min_time)) {
            end_time = min_time;
        }

        if(!moment.utc().isSame(end_time, 'day')) {
            var trading_times = this.get_trading_times(expiry_date);
            end_time = moment.utc(trading_times.closing);
        }

        this.value(Math.ceil(end_time.utc() / 1000));
    },
    min_time: function() {
        var min_unit = this.min_unit();
        return this.convert_to_end_time(min_unit.min, min_unit.units).moment;
    },
    max_time: function() {
        var max_unit = this.max_unit();
        return this.convert_to_end_time(max_unit.max, max_unit.units).moment;
    },
    min_unit: function() {
        var units = this.configured_units_by_start_time();
        var order = ['d', 'h', 'm', 's' ,'t'];
        var checking = order.length;
        while(checking > 0) {
            checking--;
            if(units[order[checking]]) {
                return units[order[checking]];
            }
        }
    },
    max_unit: function() {
        var units = this.configured_units_by_start_time();
        var order = ['t', 's', 'm', 'h', 'd'];
        var checking = order.length;
        while(checking > 0) {
            checking--;
            if(units[order[checking]]) {
                return units[order[checking]];
            }
        }
    },
    time_is_tick: function(time) {
        return this.time_is_tick_regex.test(time);
    },
    time_is_duration: function(time) {
        return this.time_is_duration_regex.test(time);
    },
    convert_to_duration: function(inputTime) {
        var units;
        var amount;
        var start_time = BetForm.attributes.start_time_moment();
        var time = moment.utc(parseInt(inputTime) * 1000);

        var diff = time.valueOf() - start_time.valueOf();
        var min_unit = this.min_unit();
        var min_expiration_time = BetForm.attributes.start_time_moment().add(min_unit.min, min_unit.units);
        if(time.isBefore(min_expiration_time)) {
            units = min_unit.units;
            amount = min_unit.min;
        } else if(diff / 1000 < 60) {
            units = 's';
            amount = Math.ceil(diff / 1000);
        } else if (diff / (60 * 1000) < 60) {
            units = 'm';
            amount = Math.ceil(diff / (60 * 1000));
        } else if (diff / (3600 * 1000) < 24) {
            units = 'h';
            amount = Math.ceil(diff / (3600 * 1000));
        } else {
            units = 'd';
            amount = time.diff(start_time, 'day');
        }

        return {
            units: units,
            amount: amount
        };
    },
    convert_to_end_time: function(duration_amount, duration_units) {
        var ms = BetForm.attributes.start_time_moment();
        ms.add(duration_amount, duration_units);
        if(duration_units == "d") {
            var trading_times = this.get_trading_times(ms.format("YYYY-MM-DD"));
            ms = trading_times.closing;
        }

        var expiry_time = ms.format('HH:mm:ss');
        if(moment.utc().isSame(ms, 'day')) {
            expiry_time = ms.format('HH:mm');
        }
        return {
            expiry_date: ms.format('YYYY-MM-DD'),
            expiry_time: expiry_time,
            moment: ms
        };
    },
    virgule_duration: function(time) {
        var units = time.substring(time.length - 1);
        var amount = time.substring(0, time.length - 1);

        return {
            units: units,
            amount: amount
        };
    },
    virgule_end_time: function(inputTime) {
        var time = parseInt(inputTime) * 1000,
            ms = moment.utc(time),
            expiry_time = ms.format('HH:mm:ss');
        
        if(moment.utc().isSame(ms, 'day')) {
            expiry_time = ms.format('HH:mm');
        }
        if(!moment.utc().isSame(ms, 'day')) {
            var trading_times = this.get_trading_times(ms.format('YYYY-MM-DD'));
            expiry_time = moment.utc(trading_times.closing).format('HH:mm:ss');
        }
        
        return {
            expiry_date: ms.format('YYYY-MM-DD'),
            expiry_time: expiry_time,
            moment: ms
        };
    },
    is_valid_duration: function(amount, unit) {
        var selected_unit = this.configured_unit_for(unit);
        if(amount < selected_unit.min) {
            return false;
        }

        return true;
    },
    configured_units_by_start_time: function() {
        var units = this.configured_units.spot;
        if(this.is_forward_starting()) {
            units = this.configured_units.forward_starting;
        }

        return units;
    },
    configured_unit_for: function(duration_unit) {
        var units = this.configured_units_by_start_time();
        return units[duration_unit];
    },
    parse_units_from_form: function() {
        var normal_durations = {};
        var forward_starting_durations = {};
        var duration_container = BetForm.attributes.duration_container();
        $('#duration_units > option').each(function(){
            var duration_unit = {};
            duration_unit.className = $(this).attr('class');
            duration_unit.selected = $(this).attr('selected');
            duration_unit.units = $(this).val();
            duration_unit.label = $(this).text();

            duration_unit.max = 59;
            if(duration_unit.units == 'd') {
                duration_unit.max = 365;
            } else if(duration_unit.units == 'h') {
                duration_unit.max = 23;
            } else if (duration_unit.units == 't') {
                duration_unit.max = 10;
            }

            if(duration_unit.className == 'forward_starting') {
                duration_unit.min_select = duration_container.find('.non_input.forward_starting.' + duration_unit.units);
                duration_unit.min = parseInt(duration_unit.min_select.html().split(":")[1]);
                forward_starting_durations[duration_unit.units] = duration_unit;
            } else {
                duration_unit.min_select = duration_container.find('.non_input.' + duration_unit.units + ':not(.forward_starting)');
                duration_unit.min = parseInt(duration_unit.min_select.html().split(":")[1]);
                normal_durations[duration_unit.units] = duration_unit;
            }
        });

        this.configured_units = {};
        this.configured_units.spot = normal_durations;
        this.configured_units.forward_starting = forward_starting_durations;
    },
    trading_dates: function() {
        var trading_dates  = [];
        var trading_days = this.get_trading_days();

        for (var day in trading_days) {
            if(trading_days[day]['trading']) {
                trading_dates.push(day);
            }
        }

        return trading_dates;
    },
    get_trading_days: function() {
        var underlying_symbol = BetForm.attributes.underlying();
        var barrier = BetForm.attributes.barrier_1();
        if (typeof this.trading_info[underlying_symbol] === 'undefined') {
            var that = this;
            $.ajax({
                url: page.url.url_for('trade_get.cgi'),
                data: { controller_action: 'trading_days',
                        underlying_symbol: underlying_symbol,
                        form_name: BetForm.attributes.form_name(),
                        date_start: BetForm.attributes.start_time(),
                        barrier: barrier,
                    },
                dataType:'json',
                async: false
            }).done(function(trading_days) {
                that.trading_info[underlying_symbol] = {};
                for (var day in trading_days) if (trading_days.hasOwnProperty(day)) {
                    var day_arr = day.split('-');
                    day_arr[1] = parseInt(day_arr[1] - 1);
                    var date = moment.utc(day_arr).format("YYYY-MM-DD");
                    that.trading_info[underlying_symbol][date] = { trading: ((trading_days[day] == 1) ? true: false) };
                }
            });
        }
        return this.trading_info[underlying_symbol];
    },
    get_trading_times: function(date) {
        var underlying_symbol = this.underlying();
        if(typeof this.trading_info[underlying_symbol] === "undefined") {
            this.get_trading_days();
        }

        var that = this;
        if(typeof this.trading_info[underlying_symbol][date] === "undefined") {
            this.trading_info[underlying_symbol][date] = { trading: 0 };
        }

        if(typeof this.trading_info[underlying_symbol][date]['opening'] === "undefined" ||
            typeof this.trading_info[underlying_symbol][date]['closing'] === "undefined") {
            $.ajax({
                url: page.url.url_for('trade_get.cgi', '', 'cached'),
                data: {
                    controller_action: 'trading_times',
                    underlying_symbol: underlying_symbol,
                    trading_date: date,
                },
                dataType: 'json',
                type: 'GET',
                async: false,
            }).done(function(response) {
                that.trading_info[underlying_symbol][date].opening = moment.utc(response.opening);
                that.trading_info[underlying_symbol][date].closing = moment.utc(response.closing);
            });
        }
        return this.trading_info[underlying_symbol][date];
    },
};

/*
 * Represents the duration ui
*/
BetForm.Time.Duration = function(trading_time) {
    this.trading_time = trading_time;
    //this.date_picker = new DatePicker.SelectedDates('duration_amount', 'diff');
};

BetForm.Time.Duration.prototype = {
    init: function() {
        this.update_units_select();
    },
    register: function() {
        this.on_unit_change();
        this.on_amount_change();

        var that = this;
        $(this.date_picker).on('enter_pressed', function() {
            $(that).trigger('enter_pressed');
        });
    },
    unregister: function() {
        this.date_picker.hide();

        $(this.date_picker).off('change');
        $('#duration_amount').off('change');

        $(this.date_picker).off('enter_pressed');
        $('#duration_units').off('change');
    },
    show: function(ms) {
        $('#expiry_type_duration').show();
        this.update_ui();
    },
    hide: function() {
        $('#expiry_type_duration').hide();
        this.date_picker.hide();
    },
    update_units_select: function() {
        $('#duration_units option').remove();
        var configured_units = this.trading_time.configured_units_by_start_time();
        for (var unit in configured_units) if (configured_units.hasOwnProperty(unit)) {
            this.add_duration_unit(configured_units[unit]);
        }
    },
    update_ui: function() {
        var selected = this.trading_time.as_duration();
        if($('#duration_units >option[value=' + selected.units + ']').length > 0) {
            $('#duration_units').val(selected.units);
            var unit = this.trading_time.configured_unit_for(selected.units);
            BetForm.attributes.duration_container().find('.non_input').hide();
            unit.min_select.show();
        }
        $('#duration_amount').val(selected.amount);
        if(selected.units == 'd') {
            this.date_picker.show(this.trading_time.trading_dates());
        } else {
            this.date_picker.hide();
        }

        var hidden_expiry_type;
        if (selected.units == 't') {
            $('#expiry_type option[value="endtime"]').prop('disabled', true);
        } else {
            $('#expiry_type option[value="endtime"]').prop('disabled', false);
            $(this).trigger('change', [ this.trading_time.as_end_time().moment ]);
        }

    },
    on_unit_change: function() {
        var that = this;
        $('#duration_units').on('change', function(event) {
            var amount = that.trading_time.as_duration().amount;
            that.trading_time.update_from_duration(amount, this.value);
            $(that).trigger('change', [ that.trading_time.as_end_time().moment ]);
            that.update_ui();
        }).addClass('unbind_later');
    },
    on_amount_change: function() {
        var that = this;
        var handle_change = function(duration) {
            var selected_units = that.trading_time.as_duration().units;
            duration = isNaN(parseInt(duration)) ? BetForm.time.trading_time.configured_unit_for(selected_units).min : parseInt(duration);
            var min_span = that.trading_time.configured_unit_for(selected_units).min_select;

            that.trading_time.update_from_duration(duration, selected_units);
            that.update_ui();
            if(that.trading_time.is_valid_duration(duration, selected_units)) {
                $(this).removeClass('error');
                min_span.removeClass('error');
            } else {
                $(this).addClass('error');
                min_span.addClass('error');
            }
        };

        $('#duration_amount').on('change', function() {
            handle_change($(this).val());
        }).addClass('unbind_later');

        $(this.date_picker).on('change', function(event, duration) {
            handle_change(duration);
        });
    },
    add_duration_unit: function(duration_unit) {
        if(duration_unit) {
            var option = this.create_option(duration_unit);
            var drop_down = document.getElementById("duration_units");
            try {
                // for IE version less than 8
                drop_down.add(option, drop_down.options[null]);
            } catch (e) {
                drop_down.add(option, null);
            }
        }
    },
    create_option: function(duration_unit) {
        var option = document.createElement("option");

        option.className = duration_unit.className;
        option.value = duration_unit.units;
        option.selected = duration_unit.selected;
        option.text = duration_unit.label;

        return option;
    },
};

/*
 * Represents the end time ui
*/
BetForm.Time.EndTime = function(trading_time) {
    this.trading_time = trading_time;
//    this.time_picker = new TimePicker('expiry_time');
//    this.date_picker = new DatePicker.SelectedDates('expiry_date');
};

BetForm.Time.EndTime.prototype = {
    init: function() {
    },
    register: function() {
        this.on_time_change();
        this.on_date_change();

        var that = this;
        var when_enter_pressed = function() {
            $(that).trigger('enter_pressed');
        };

        $(this.time_picker).on('enter_pressed', when_enter_pressed);
        $(this.date_picker).on('enter_pressed', when_enter_pressed);
    },
    unregister: function() {
        this.time_picker.hide();
        this.date_picker.hide();
        $(this.date_picker).off('change');
        $(this.time_picker).off('change');

        $(this.date_picker).off('enter_pressed');
        $(this.time_picker).off('enter_pressed');
    },
    show: function(ms) {
        $('#expiry_type_endtime').show();
        this.update_ui();
    },
    hide: function() {
        $('#expiry_type_endtime').hide();
        this.time_picker.hide();
        this.date_picker.hide();
    },
    update_ui: function() {
        var selected = this.trading_time.as_end_time();
        $('#expiry_date').val(selected.expiry_date);
        $('#expiry_time').val(selected.expiry_time);
        $(this).trigger('change', [ selected.moment ]);

        var now = moment.utc();
        this.date_picker.hide();
        this.time_picker.hide();
        if(now.isSame(selected.moment, 'day')) {
            $('#expiry_time').attr('disabled', false);
            var trading_times = this.trading_time.get_trading_times(selected.expiry_date);
            this.time_picker.show(trading_times.opening, trading_times.closing);
            $('#market-closed-tip').hide();
        } else {
            $('#expiry_time').attr('disabled', true);
            $('#market-closed-tip').show();
        }

        if(this.trading_time.is_forward_starting()) {
            $('#expiry_date').attr('disabled', true);
        } else {
            $('#expiry_date').attr('disabled', false);
        }

        //Add Today, to make it selectable.
        var min_unit = this.trading_time.min_unit();
        var dates = this.trading_time.trading_dates();
        if(min_unit.units !== "d" || min_unit.min === 0) {
            dates.push(now.format("YYYY-MM-DD"));
        }
        this.date_picker.show(dates);
    },
    on_date_change: function() {
        var that = this;
        $(this.date_picker).on('change', function(event, date) {
            var selected = that.trading_time.as_end_time();
            that.trading_time.update_from_end_time(date, selected.expiry_time);
            that.update_ui();
        }).addClass('unbind_later');
    },
    on_time_change: function() {
        var that = this;
        $(this.time_picker).on('change', function(event, time) {
            var selected = that.trading_time.as_end_time();
            that.trading_time.update_from_end_time(selected.expiry_date, time);
            that.update_ui();
        }).addClass('unbind_later');
    },
};
;var BetPrice = function() {
    var price_request = null;
    var _buy_response_container = null;
    return {
        deregister: function() {
            $('#content button.buy_bet_button').off('click');
        },
        container: function() {
            return $('#bet_calculation_container');
        },
        price_url: function() {
            var url = BetForm.attributes.form_selector() ? BetForm.attributes.form_selector().action : '';
            if (url) {
                return url;
            } else {
                return '';
            }
        },
        params: function() {
            var params = getFormParams(BetForm.attributes.form_selector());
            params += '&st=' + BetForm.attributes.underlying();
            params += '&expiry=' + BetForm.attributes.duration_string();
            params += '&'+Math.floor(Math.random()*83720);
            params += '&ajax_only=1&price_only=1';
            return params;
        },
        cancel_previous_request: function() {
            if (price_request) {
                price_request.abort();
            }
        },
        get_price: function() {
            var that = this;
            this.cancel_previous_request();
            this.show_loading();
            var url = this.price_url();
            if (url) {
                price_request = $.ajax(ajax_loggedin({
                  url     : url,
                  dataType: 'html',
                  data    : this.params(),
                  success : function(data) { that.price_update(data); },
                })).fail(function ( jqXHR, textStatus ) {
                    that.error_handler();
                });
            } else {
                that.error_handler();
            }
        },
        error_handler: function() {
            this.container().find('div.rbox-lowpad:first').html(text.localize("There was a problem accessing the server."));
            this.streaming.stop();
        },
        price_update: function(data) {
            price_request = null;
            this.deregister();
            var price_container = BetPrice.container().find('div.rbox-lowpad:first');
            price_container.hide().html(data);
            this.on_buy();
            var sendBetUrl = $('#sendBetUrlLink').attr('href');
            if (sendBetUrl){
                page.url.update(sendBetUrl);
            }
            price_container.show();
            BetForm.amount.update_settings();
            this.streaming.start();
        },
        on_buy: function() {
            var that = this;
            $('#content button.buy_bet_button').on('click', function (e) {
                e = e || window.event;
                if (typeof e.preventDefault == 'function') {
                    e.preventDefault();
                }
                var form = $(e.target).parents('form');
                that.buy_bet(form);
                return false;
            }).addClass('unbind_later');
        },
        buy_bet: function (form) {
            var that = this;
            var timeout = 60000;
            BetPrice.order_form.disable_buy_buttons();
            that.hide_buy_buttons();

            if(!$.cookie('login')) {
                page.client.is_logged_in = false;
                window.location.href = page.url.url_for('login');
                return;
            }

            // pass the DOM form object wrapped in jQuery form object to getFormParams
            var data = getFormParams(form.get(0)) + '&ajax_only=1';
            $.ajax(ajax_loggedin({
                url     : form.attr('action'),
                type    : 'POST',
                async   : true,
                data    : data,
                timeout : timeout,
                success : function (resp, resp_status, jqXHR) { that.on_buy_bet_success(form, resp, resp_status, jqXHR); },
                error   : function (jqXHR, resp_status, exp) { that.on_buy_bet_error(form, jqXHR, resp_status, exp); },
            }));
            $('.price_box').fadeTo(200, 0.6);
        },
        on_buy_bet_success: function (form, resp, resp_status, jqXHR) {
            var data = {};
            if (typeof resp == 'object') {
               data = resp;
            } else {
                try {
                    data = (JSON && JSON.parse(resp)) || $.parseJSON(resp) || {};
                } catch (e) {
                    var width = this.container().width() || 300; // since the error message could be any size, set the continer size to a good value
                    return;
                }
            }
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            } else if (data.error) {
                var width = this.container().width(); // since the error message could be any size, set the continer size to a good value
                this.display_buy_error(data.error);
            } else if (data.display) {
                this.display_buy_results(data);
                BetSell.register();
            } else {
                throw new Error("Invalid server response: " + data);
            }
            $('.price_box').fadeTo(0, 1);
            BetPrice.order_form.enable_buy_buttons();
            this.display_buy_buttons();
        },
        on_buy_bet_error: function (form, jqXHR, resp_status, exp) {
            var details = '' + exp;
            if (jqXHR.responseText) {
                details += jqXHR.responseText;
            } else if (document.location.href.match(/^http:/) && (!details || details.match(/access/i))) {
                details += '<ul>Please <a href="' + document.location.href.replace('http://', 'https://') + '">continue browsing using HTTPS secure protocol</a></ul>';
            } else {
                details += text.localize('There was a problem accessing the server during purchase.');
            }
            var width = this.container().width(); // since the error message could be any size, set the continer size to a good value
            this.display_buy_error('<div style="width: ' + width + 'px;"><h3>Error</h3><p>' + details + ' </p></div>', 1);
            $('.price_box').fadeTo(0, 1);
            BetPrice.order_form.enable_buy_buttons();
            this.display_buy_buttons();
        },
        buy_response_container: function () {
            if (!_buy_response_container) {
                var price_container = this.container();
                _buy_response_container = $('<div id="buy_confirm_container" class="trade_confirm_container ajax_response"><a class="close">x</a><div></div></div>');
                _buy_response_container.hide();
                _buy_response_container.height('100%');
                price_container.append(_buy_response_container);
            }
            return _buy_response_container;
        },
        display_buy_results: function (data) {
            var that = this;

            var display_html = data.display;
            var con = this.buy_response_container();
            con.children('div').first().html(display_html);

            if ($('#tick_chart').length > 0) {
                data['show_contract_result'] = 1;
                TickDisplay.initialize(data);
            }

            if ($('#is-digit').data('is-digit')) {
                var start_moment = moment(data.contract_start*1000).utc();
                that.digit.process(start_moment);
            }

            con.show();
            // push_data_layer();
            var _clear_results = function () { that.clear_buy_results(); };
            con.find('a.close').on('click', _clear_results).css('cursor', 'pointer').addClass('unbind_later');
        },
        digit: function() {
            return {
                reset: function() {
                    var $self = this;

                    $self.ev.close();
                    $self.digit_tick_count = 0;
                    $self.applicable_ticks = [];
                    $self.info_for_display = [];
                },
                process: function(start_moment) {
                    var $self = this;

                    $self.digit_tick_count = 0;
                    $self.applicable_ticks = [];
                    $self.info_for_display = [];
                    var symbol = BetForm.attributes.underlying();
                    var how_many_ticks = $('#tick-count').data('count');
                    var stream_url = window.location.protocol + '//' + page.settings.get('streaming_server');
                    stream_url += "/stream/ticks/" + symbol + "/" + start_moment.unix();
                    $self.ev = new EventSource(stream_url, { withCredentials: true });

                    $self.ev.onmessage = function(msg) {
                        var data = JSON.parse(msg.data);
                                if (!(data[0] instanceof Array)) {
                                    data = [ data ];
                                }
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i][0] === 'tick') {
                                        var tick = {
                                            epoch: data[i][1],
                                            quote: data[i][2]
                                        };
                                        if (tick.epoch > start_moment.unix() && $self.digit_tick_count < how_many_ticks) {
                                            $self.applicable_ticks.push(tick.quote);
                                            $self.digit_tick_count++;
                                            $self.info_for_display.push([$self.digit_tick_count,tick.epoch,tick.quote]);
                                            var last_digit = tick.quote.toString().substr(-1);
                                            if (!$('#digit-current').hasClass('flipper')) {
                                                $('#digit-current').addClass('flipper focus');
                                            }
                                            $self.update_display();

                                            if ($('#digit-contract-details').css('display') === 'none') {
                                                $('#digit-contract-details').show();
                                            }
                                        }

                                        if ($self.applicable_ticks.length === how_many_ticks) {
                                            $self.evaluate_digit_outcome();
                                            $self.reset();
                                            break; // need to break the loop else it will keep on processing the extra tick
                                        }
                                    }
                                }
                    };
                    $self.ev.onerror = function() { $self.ev.close(); };
                },
                update_display: function(data) {
                    var $self = this;

                    var ticks_to_display = $self.info_for_display.slice(-5);
                    for (var i=0;i<5;i++) {
                        if (typeof ticks_to_display[i] !== 'undefined') {
                            var tick_number = ticks_to_display[i][0];
                            var tick_time = moment.utc(ticks_to_display[i][1]*1000).format("hh:mm:ss");
                            var tick_string = ticks_to_display[i][2].toString();
                            $('#count-'+i).text('Tick '+tick_number);
                            $('#time-'+i).text(tick_time);
                            var shorten = tick_string.substr(0,tick_string.length-1);
                            var last = tick_string.substr(-1);
                            $('#tick-'+i+' span#latest-shorten').text(shorten);
                            $('#tick-'+i+' span#latest-last').text(last);
                        }
                    }
                },
                evaluate_digit_outcome: function() {
                    var $self = this;

                    var prediction = $('#contract-sentiment').data('contract-sentiment');
                    var client_prediction = $('#client-prediction').data('client-prediction');
                    var last_tick = $self.applicable_ticks[$self.applicable_ticks.length-1];
                    var last_digit = parseInt(last_tick.toString().substr(-1));
                    var potential_payout = parseFloat($('#outcome-payout').data('payout').toString().replace(',',''));
                    var cost = parseFloat($('#outcome-buyprice').data('buyprice').toString().replace(',',''));
                    var final_price;

                    if (prediction === 'match') {
                        final_price = (last_digit === client_prediction) ? potential_payout : 0;
                    } else if (prediction === 'differ') {
                        final_price = (last_digit !== client_prediction) ? potential_payout : 0;
                    }

                    $('#confirmation_table').hide();
                    $('#contract-outcome-payout').text($self.round(final_price,2));

                    if (final_price !== 0) {
                        $('#bet-confirm-header').text(text.localize('This contract won'));
                        $('#contract-outcome-profit').removeClass('standin').addClass('standout profit').text($self.round(potential_payout - cost,2));
                        $('#digit-contract-details').css('background', 'rgba(46,136,54,0.198039)');
                    } else {
                        $('#bet-confirm-header').text(text.localize('This contract lost'));
                        $('#contract-outcome-label').removeClass('standout profit').addClass('standin loss').text(text.localize('Loss'));
                        $('#contract-outcome-profit').removeClass('standout profit').addClass('standin loss').text($self.round(cost,2));
                        $('#digit-contract-details').css('background', 'rgba(204,0,0,0.098039)');
                    }

                    $('#contract-outcome-details').show();
                },
                round: function(number,number_after_dec) {
                    var result = Math.round(number * Math.pow(10,number_after_dec)) / Math.pow(10,number_after_dec);
                    result = result.toFixed(number_after_dec);
                    return result;
                },
            };
        }(),
        display_buy_error: function (data, extra_info) {
            var that = this;
            var con = this.buy_response_container();
            con.addClass('bet_confirm_error');
            if (extra_info) {
                data += '<p>' + text.localize('Please confirm the trade on your statement before proceeding.') + '</p>';
            }
            data = '<p>' + data + '</p>';
            con.children('div').first().html(data);
            con.show();
            var _clear_results = function () { that.clear_buy_results(); };
            con.find('a.close').on('click', _clear_results).css('cursor', 'pointer').addClass('unbind_later');
        },
        clear_buy_results: function () {
            var con = this.buy_response_container();
            if ($('#tick_chart').length > 0) {
                TickDisplay.reset();
            }

            if ($('#is-digit').data('is-digit')) {
                this.digit.reset();
            }
            con.hide().remove();
            _buy_response_container = null;
        },
        hide_buy_buttons: function() {
            this.deregister();
            this.order_form.hide_buy_button();
        },
        display_buy_buttons: function() {
            this.on_buy();
            this.order_form.show_buy_button();
        },
        show_loading: function() {
            var image_link = page.settings.get('image_link');
            var loading_html = '<div class="progress"></div>';
            this.container().find('div.rbox-lowpad:first').show().html('<div class="rbox rbox-bg-alt"><div class="rbox-wrap"><div class="rbox-content">'+loading_html+'</div></div><span class="tl">&nbsp;</span><span class="tr">&nbsp;</span><span class="bl">&nbsp;</span><span class="br">&nbsp;</span></div></div>');
            this.container().show();
        },
        streaming: function() {
            var price_stream = null;
            var update_from_stream = false;
            return {
                start: function() {
                    BetForm.spot.clear_sparkline();
                    this.stop();
                    update_from_stream = true;
                    var url = this.url();
                    if(url && typeof (EventSource) !== "undefined") {
                        price_stream = new EventSource(url, { retry: 18000000 });
                        var that = this;
                        price_stream.onmessage = function(e) {
                            that.process_message(e.data);
                        };
                        price_stream.addEventListener("ping", function(e) { return true; });
                    } else {
                        $('#spot_spark').html("<span title=\"" + text.localize("We are not able to stream live prices at the moment. To enjoy live streaming of prices try refreshing the page, if you get this issue after repeated attempts try a different browser") + "\">" + text.localize("No Live price update") + "</span>");
                    }
                },
                stop: function() {
                    if (price_stream !== null) {
                        price_stream.close();
                        price_stream = null;
                    }
                },
                ignore_updates: function() {
                    update_from_stream = false;
                },
                url: function() {
                    return $('#stream_url').html();
                },
                process_message: function(data) {
                    if(data == 'stop_bet') {
                        BetPrice.order_form.hide_buy_button();
                    } else {
                        BetPrice.order_form.show_buy_button();
                    }

                    if(update_from_stream) {
                        var bet = JSON.parse(data);
                        BetForm.spot.update(bet.spot);
                        BetPrice.order_form.update_from_stream(bet.prices);
                        BetAnalysis.tab_last_digit.update(BetForm.attributes.underlying(), bet.spot);
                    }
                },
            };
        }(),
        order_form: function() {
            return {
                forms: function() {
                    return $('form[name=orderform]');
                },
                form_by_id: function(id) {
                    return $('#orderform_' + id);
                },
                verify_display_id: function(id) {
                    var display_id = $('input[name="display_id"]', this.form_by_id(id));
                    return (display_id && display_id.val() == id);
                },
                hide_buy_button: function() {
                    return $('button[name^="btn_buybet"]').parent().hide();
                },
                show_buy_button: function() {
                    return $('button[name^="btn_buybet"]').parent().show();
                },
                disable_buy_buttons: function() {
                    $('button[name^="btn_buybet"]').attr('disabled','disabled');
                },
                enable_buy_buttons: function() {
                    $('button[name^="btn_buybet"]').removeAttr('disabled');
                },
                update_from_stream: function(stream) {
                    var prices = this.prices_from_stream(stream);
                    this.update(prices);
                },
                update: function(prices) {
                    prices = typeof prices !== 'undefined' ? prices : this.prices_from_form();
                    this.update_form(prices);
                    this.update_ui(prices);
                },
                prices_from_stream: function(stream) {
                    var prices = [];
                    for (var i = 0; i < stream.length; i++) {
                        var id = stream[i].id || undefined;
                        var prob = stream[i].prob || undefined;
                        if (!id || prob === undefined) {
                            continue;
                        }

                        prices.push(this.calculate_price(id, prob, stream[i].err));
                    }

                    return prices;
                },
                prices_from_form: function () {

                    var prices = [],
                        order_forms = $('.orderform'),
                        order_forms_count = order_forms ? order_forms.length : 0,
                        i,
                        id,
                        prob,
                        error;

                    if (order_forms_count > 0 ) {
                        for (i = 0; i < order_forms_count; i++) {
                            id = $('input[name="display_id"]', form).val();
                            prob = $('input[name="prob"]', form).val();
                            var form = $(order_forms[i]),
                                error_box_html = form.parent().parent().parents().siblings(".bet-error-box").html();
                            // We handle payout messages locally and after recalculation
                            if (error_box_html.length > 0 &&
                                error_box_html != BetForm.amount.payout_err &&
                                error_box_html != BetForm.amount.stake_err) {
                                error = error_box_html;
                            }
                            prices.push(this.calculate_price(id, prob, error));
                        }
                    } else {
                        var error_boxes = $('#bet_calculation_container').find('.bet-error-box');
                        var count = error_boxes.length;
                        for (i = 0; i < count; i++) {
                            var error_box = $(error_boxes[i]);
                            id = error_box.find('#error_display_id').val();
                            if(!id) {
                                continue;
                            }
                            prob = error_box.find('#error_probability_' + id).val();
                            error = undefined;
                            if(error_box.html().length > 0) {
                                error = error_box.html();
                            }
                            prices.push(this.calculate_price(id, prob, error));
                        }
                    }
                    return prices;
                },
                calculate_price: function(id, prob, error) {
                    var form = this.form_by_id(id);
                    var amount = BetForm.amount.calculation_value;
                    var price;
                    var payout;
                    var profit;
                    var roi;
                    if(BetForm.attributes.is_amount_stake()) {
                        payout = this.virgule_amount(Math.round((amount / prob) * 100));
                        price = this.virgule_amount(amount * 100);
                    } else if(BetForm.attributes.is_amount_payout()) {
                        price = this.virgule_amount(Math.round((amount * prob) * 100));
                        payout = this.virgule_amount(amount * 100);
                    }

                    var prev_price = $('input[name="price"]', form).length ? parseFloat($('input[name="price"]', form).val()) : 0;
                    var prev_payout = $('input[name="payout"]', form).length ? parseFloat($('input[name="payout"]', form).val()) : 0;

                    if (payout && price) {
                        profit =  this.virgule_amount(payout.raw - price.raw);
                        roi = Math.round(profit.raw / price.raw * 100);
                    } else {
                        profit = this.virgule_amount(0);
                        roi = this.virgule_amount(0);
                    }

                    payout = payout ? payout : this.virgule_amount(0);
                    price = price ? price : this.virgule_amount(0);

                    return {
                        id: id,
                        prob: prob,
                        err: error,
                        price: price,
                        payout: payout,
                        profit: profit,
                        roi: roi,
                        prev_price: this.virgule_amount(prev_price * 100),
                        prev_payout: this.virgule_amount(prev_payout * 100)
                    };
                },
                update_form: function(prices) {
                    for (var i = 0; i < prices.length; i++) {
                        var form = this.form_by_id(prices[i].id);
                        $('input[name="prob"]', form).val(prices[i].prob);
                        $('input[name="price"]', form).val(prices[i].price.raw/100);
                        $('input[name="payout"]', form).val(prices[i].payout.raw/100);
                        $('input[name="amount_type"]', form).val(BetForm.attributes.amount_type());
                    }
                },
                update_ui: function(prices) {
                    for (var i = 0; i < prices.length; i++) {
                        var form = this.form_by_id(prices[i].id);
                        var err = prices[i].err;
                        var bf_amount = BetForm.amount;
                        var epsilon = 0.001; // Outside the visible range of a price.
                        // We're intentionally making payout errors have highest priority
                        // it's something they can fix immediately on this web interface.

                        if (prices[i].payout.raw/100  - epsilon > bf_amount.payout_max ||
                            prices[i].payout.raw/100 + epsilon < bf_amount.payout_min) {
                            err = bf_amount.payout_err;
                        } else if (prices[i].price.raw/100 - epsilon > bf_amount.stake_max ||
                            prices[i].price.raw/100 + epsilon < bf_amount.stake_min) {
                            // You probably think there should be two conditions above, but too high stake just
                            // makes for "too high payout" or "no return" errors.
                            err = bf_amount.stake_err;
                        }
                        this.show_error(form, err);
                        this.update_price(prices[i].id, prices[i].price, prices[i].prev_price);
                        this.update_description(prices[i].id, prices[i].payout, prices[i].prev_payout);
                        this.update_profit_roi(prices[i].id, prices[i].profit, prices[i].roi);
                    }
                },
                update_price: function(id, price, old_price) {
                    var units_box = $('#units_for_' + id);
                    var cents_box = $('#cents_for_' + id);
                    var amount_box = $('#amount_for_' + id);

                    price_moved(amount_box, old_price.raw, price.raw);

                    units_box.text(price.units);
                    cents_box.text(price.cents);
                },
                update_description: function(id, payout, old_payout) {
                    $('#amount_for_' + id).siblings('.bet_description').each(function () {
                            var payout_element = $('strong:first-child', $(this));
                            payout_element.html(payout.value);
                            price_moved(payout_element, old_payout.raw, payout.raw);
                    });
                },
                update_profit_roi: function(id, profit, roi) {
                    $("#id_" + id + "_profit").text(profit.value);
                    $("#id_" + id + "_roi").text(roi);
                },
                show_error: function(form, error) {
                    var buy_button= form.parent();
                    var error_box = buy_button.parents().siblings(".bet-error-box");
                    if (!error) {
                        error_box.hide();
                        buy_button.show();
                    } else {
                        error_box.html(error);
                        error_box.show();
                        buy_button.hide();
                    }
                },
                virgule_amount: function (big_amount) {
                    var amount_string = big_amount.toFixed(0).toString();

                    while (amount_string.length < 3)  {
                        amount_string = '0' + amount_string;
                    }

                    var amount_break = amount_string.length - 2;

                    var units =  virgule(amount_string.substr(0, amount_break));
                    var cents =  '.' + amount_string.substr(amount_break);

                    return {
                        units: units,
                        cents: cents,
                        value: units + cents,
                        raw: big_amount
                    };
                },
            };
        }(),
    };
}();
;var BetSell = function() {
    var _sell_request = null;
    var _analyse_request = null;
    var _container = null;
    var _sell_button_disabled = false;
    var _timer_interval_obj = {};
    var _timeout_variables = {};
    var _previous_button_clicked = null;
    var _diff_end_start_time = 300; // we show point markers if end time start time difference is <= than this (5 minutes default)
    var _model = {
        currency: null,
        shortcode: null,
        payout: null,
        purchase_price: null,
        reload_page_on_close: false,
    };
    return {
        _init: function () {
            _sell_request = null;
            _analyse_request = null;
            _container = null;
            _sell_button_disabled = false;
            _timer_interval_obj = {};
            _timeout_variables = {};
            _previous_button_clicked = null;
            _model = {
                currency: null,
                shortcode: null,
                payout: null,
                purchase_price: null,
                reload_page_on_close: false,
            };
            this.update_high_low(true);
        },
        model: {
            currency: function (val) {
                if (val) {
                    _model.currency = val;
                    return this;
                }
                return _model.currency;
            },
            shortcode: function (val) {
                if (val) {
                    _model.shortcode = val;
                    return this;
                }
                return _model.shortcode;
            },
            payout: function (val) {
                if (val) {
                    _model.payout = val;
                    return this;
                }
                return _model.payout;
            },
            purchase_price: function (val) {
                if (val) {
                    _model.purchase_price = val;
                    return this;
                }
                return _model.purchase_price;
            },
            reload_page_on_close: function (val) {
                if (val !== undefined) {
                    _model.reload_page_on_close = (val ? true : false);
                    return this;
                }
                return _model.reload_page_on_close;
            },
        },
        container: function (refresh) {
            if (refresh) {
                if (this._container) {
                    this._container.remove();
                }
                this._container = null;
            }
            if (!this._container) {
                var that = this;
                var con = $('<div class="inpage_popup_container" id="sell_popup_container"><a class="close">x</a><div class="inpage_popup_content"></div></div>');
                con.hide();
                var _on_close = function () {
                    var should_reload = that.model.reload_page_on_close();
                    that.cleanup(true);
                    if (should_reload) {
                        window.location.reload(true);
                    }
                };
                con.find('a.close').on('click', function () { _on_close(); } );
                $(document).on('keydown', function(e) {
                     if (e.which === 27) _on_close();
                });
                this._container = con;
            }
            return this._container;
        },
        clear_timers: function () {
            for (var timerKey in _timer_interval_obj) {
                if (_timer_interval_obj.hasOwnProperty(timerKey)) {
                    window.clearInterval(_timer_interval_obj[timerKey]);
                }
            }
            for (var timeoutKey in _timeout_variables) {
                if (_timeout_variables.hasOwnProperty(timeoutKey)) {
                    window.clearTimeout(_timeout_variables[timeoutKey]);
                }
            }
        },
        cleanup: function (cancel_prev_req) {
            this.close_container();
            if (cancel_prev_req) {
                this.cancel_previous_sell_request();
                this.cancel_previous_analyse_request();
            }
            this._init();
        },
        basic_cleanup: function () {
            this.clear_timers();
            this.sparkline.clear();
            this.streaming.stop();
            this.streaming.url(null);
        },
        close_container: function () {
            this.basic_cleanup();
            if (live_chart && typeof live_chart !== "undefined") {
                live_chart.close_chart();
            }
            if (this._container) {
                this._container.hide().remove();
                this._container = null;
            }
        },
        server_data: function () {
            var data = {};
            var field = $('#sell_extra_info_data');
            if (field) {
                if (sessionStorage.getItem('stream_url') && sessionStorage.getItem('stream_url') == field.attr('stream_url')) {
                    data['stream_url'] = sessionStorage.getItem('stream_url');
                } else {
                    sessionStorage.setItem('stream_url', field.attr('stream_url'));
                    data['stream_url'] = field.attr('stream_url');
                }
                if (sessionStorage.getItem('submit_url') && sessionStorage.getItem('submit_url') == field.attr('submit_url')) {
                    data['submit_url'] = sessionStorage.getItem('submit_url');
                } else {
                    sessionStorage.setItem('submit_url', field.attr('submit_url'));
                    data['submit_url'] = field.attr('submit_url');
                }
                if (sessionStorage.getItem('error_message') && sessionStorage.getItem('error_message') == field.attr('submit_url')) {
                    data['error_message'] = sessionStorage.getItem('error_message');
                } else {
                    sessionStorage.setItem('error_message', field.attr('error_message'));
                    data['error_message'] = field.attr('error_message');
                }
                data['barrier'] = field.attr('barrier');
                data['barrier2'] = field.attr('barrier2');
                data['is_immediate'] = field.attr('is_immediate');
                data['is_negative'] = field.attr('is_negative');
                data['is_forward_starting'] = field.attr('is_forward_starting');
                data['trade_feed_delay'] = field.attr('trade_feed_delay');
            }
            return data;
        },
        general_error_message: function () {
            var data = this.server_data();
            return data.error_message || 'Contract cannot be sold at this time.';
        },
        show_warning: function(data, replace) {
            if (replace) {
                this.clear_warnings();
            }
            var con = this.container();
            $('.sell_price_wrapper', con).hide();
            var warn_con = $(con.find('#warning_container')[0]);
            var warn = $('<p class="comment">' + data + '</p>');
            warn_con.html(warn).show();
            warn.show();
        },
        clear_warnings: function() {
            var warn_con = $(this.container().find('#warning_container')[0]);
            warn_con.hide();
            $('.message', warn_con).each(function () { $(this).hide().remove(); });
        },
        sell_button: function () {
            return $(this.container().find('#sell_at_market')[0]);
        },
        disable_button: function (button) {
            button.attr('disabled', 'disabled');
            button.fadeTo(0, 0.5);
        },
        enable_button: function (button) {
            button.removeAttr('disabled');
            button.fadeTo(0, 1);
        },
        disable_sell_button: function (hide) {
            var btn = this.sell_button();
            var that = this;
            btn.attr('disabled', 'disabled');
            if (hide) {
                btn.hide();
                $('#sell_contract_form', that.container()).hide();
            }
            this._sell_button_disabled = true;
        },
        enable_sell_button: function () {
            if (this._sell_button_disabled) {
                $('#sell_contract_form', this.container()).show();
                var btn = this.sell_button();
                btn.removeAttr('disabled');
                btn.show();
                this._sell_button_disabled = false;
            }
        },
        get_loading_html: function() {
            var image_link = page.settings.get('image_link');
            return '<div class="progress"></div>';
        },
        show_inpage_popup: function (data) {
            var con = this.container(true);
            if (data) {
                $('.inpage_popup_content', con).html(data);
            }
            var body = $(document.body);
            con.css('position', 'fixed').css('z-index', get_highest_zindex() + 100);
            body.append(con);
            con.show();
            this.reposition_confirmation();
            return con;
        },
        reposition_confirmation: function (x, y) {
            var con = this.container();
            var win_ = $(window);

            var x_min = 50;
            var y_min = 50;

            //To be responsive, on mobiles and phablets we show popup as full screen.
            if(win_.width() < 767) {
                x_min = 0;
                y_min = 0;
            }

            if (x === undefined) {
                x = Math.max(Math.floor((win_.width() - win_.scrollLeft() - con.width()) / 2), x_min) + win_.scrollLeft();
            }

            if (y === undefined) {
                y = Math.min(Math.floor((win_.height() - con.height()) / 2), y_min) + win_.scrollTop();
            }

            con.offset({left: x, top: y});
        },
        update_price: function (price) {
            var con = this._container;
            if (!con) {
                throw new Error("container is not available yet");
            }
            if (typeof price == 'object') {
                if (typeof price.price != 'undefined') {
                    price = price.price;
                } else if (typeof price.prob != 'undefined') {
                    var payout = this.model.payout();
                    if (isNaN(payout)) {
                        throw new Error("Invalid payout " + payout);
                    }
                    price = price.prob * payout;
                }
            }
            if (isNaN(price)) {
                throw new Error("Invalid price structure: " + price);
            }

            // update returns
            this.update_return(price);

            price = parseFloat(price).toFixed(2);
            var cur = this.model.currency(),
                prev_price;
            var price_parts = stylized_price(price);
            var price_con = $('#sell_price_container', con);

            if(price_con.length > 0) {
                var stylized = $('.stylized_price', price_con);
                $('.stylized_units', stylized).html(price_parts.units);
                $('.stylized_cents', stylized).html(price_parts.cents);
                $('.stylized_currency', stylized).html(cur);
                var price_field = $('input[name="price"]', price_con);
                prev_price = price_field.val();
                price_field.val(price);
                BetSell.sparkline.update(price);
                if (!prev_price) {
                    return;
                }

                if (prev_price < price) {
                    stylized.removeClass('price_moved_down');
                    stylized.addClass('price_moved_up');
                } else if (prev_price > price) {
                    stylized.removeClass('price_moved_up');
                    stylized.addClass('price_moved_down');
                } else {
                    stylized.removeClass('price_moved_up');
                    stylized.removeClass('price_moved_down');
                }
            }
            var trade_price = $('#trade_details_price', con);
            if (trade_price.length > 0) {
                prev_price = parseFloat(trade_price.html());
                trade_price.html(price_parts.units + '' + price_parts.cents);
                if (prev_price < price) {
                    trade_price.removeClass('price_moved_down');
                    trade_price.addClass('price_moved_up');
                } else if (prev_price > price) {
                    trade_price.removeClass('price_moved_up');
                    trade_price.addClass('price_moved_down');
                } else {
                    trade_price.removeClass('price_moved_up');
                    trade_price.removeClass('price_moved_down');
                }

            }
        },
        update_return: function(price) {
            var con = this._container;
            var trade_return = $('#trade_details_return', con);
            if (trade_return.length > 0) {
                price = (((price - this.model.purchase_price()) / this.model.purchase_price()) * 100 ).toFixed(2);
                trade_return.html(price + '%');
            }
        },
        update_spot: function (spot) {
            var con = this._container;
            if (!con) {
                throw new Error("container is not available yet");
            }
            var trade_spot = $('#now_spot', con);
            if (trade_spot.length > 0) {
                var prev_spot = parseFloat(trade_spot.html());
                trade_spot.html(spot);
                if (prev_spot < spot) {
                    trade_spot.removeClass('price_moved_down');
                    trade_spot.addClass('price_moved_up');
                } else if (prev_spot > spot) {
                    trade_spot.removeClass('price_moved_up');
                    trade_spot.addClass('price_moved_down');
                } else {
                    trade_spot.removeClass('price_moved_up');
                    trade_spot.removeClass('price_moved_down');
                }
            }
        },
        update_barriers: function (barriers) {
            var that = this;
            var con = $('#live_barriers');
            if (barriers.barrier) {
                $('#now_barrier .dir', con).text(barriers.barrier.dir);
                $('#now_barrier .diff', con).text(barriers.barrier.diff);
            }
            if (barriers.barrier2) {
                $('#now_barrier2 .dir', con).html(barriers.barrier2.dir);
                $('#now_barrier2 .diff', con).text(barriers.barrier2.diff);
            }
        },
        update_high_low: function (force) {
            var con = this._container;
            var spot = $('#now_spot', con).html();
            var high = $('#now_high', con);
            var low = $('#now_low', con);
            var changed = false;
            if (high.length > 0) {
                spot = parseFloat(spot);
                if (spot > parseFloat(high.html())) {
                    high.html(spot);
                    changed = true;
                }
            }
            if (low.length > 0) {
                spot = parseFloat(spot);
                if (spot < parseFloat(low.html())) {
                    low.html(spot);
                    changed = true;
                }
            }
            if (changed || force) {
                ['now', 'final', 'eo'].forEach(function (place) {
                    var tooltip = $('#'+place+'_high_low_tooltip');
                    var local_high = $('#'+place+'_high');
                    var local_low = $('#'+place+'_low');
                    if (tooltip && local_high && local_low) {
                        tooltip.attr("title", text.localize('High') + ': '+local_high.html()+' '+text.localize('Low')+': '+ local_low.html());
                    }
                });
            }
            // Force all tooltips to the top all the time.
            // Hopefully, this isn't expensive.
            $('abbr').css('z-index', get_highest_zindex() + 1000);
        },
        resubmit_sell_at_market: function () {
            var that = this;
            this.basic_cleanup();
            $('.sell_bottom_content').hide();
            this.add_overlay();
            $('#reload_sell_container').show();
            $('#reload_sell_container').on('click', '#reload_sell', function () {
                that.close_container();
                _timeout_variables[Object.keys(_timeout_variables).length] = setTimeout(function() {
                    that.sell_at_market(_previous_button_clicked);
                }, 2000);
                // invoke submit after 2 seconds so settlement time differ from expiry date
            });
        },
        sell_at_market: function (element) {
            var that = this;
            var dom_element = $(element);
            this.cancel_previous_analyse_request();
            var attr = this.data_attr(element);
            var params = this.get_params(element);
            _analyse_request = $.ajax(ajax_loggedin({
                url     : attr.url(),
                type    : 'POST',
                async   : true,
                data    : params,
                success : function (data) {
                    var con = that.show_sell_at_market(data);
                    var server_data = that.server_data();
                    $('.tab_menu_container').tabs({
                        load: function(event, ui){
                           var load_live_chart = ui.tab.find(".ui-tabs-anchor").attr('load_live_chart');
                           if (load_live_chart && load_live_chart == 1) {
                               var symbol = ui.tab.find(".ui-tabs-anchor").attr('underlying_symbol');
                               var liveChartConfig = new LiveChartConfig({ renderTo: 'analysis_live_chart', symbol: symbol, with_trades: 0, shift: 0});
                               var time_obj = that.get_time_interval();
                               if(time_obj['is_live'] && time_obj['is_live'] === 1) {
                                    liveChartConfig.update( {
                                        live: '10min'
                                    });
                               } else {
                                   var from_date, to_date;
                                   if (server_data.is_forward_starting > 0) {
                                       if(server_data.trade_feed_delay > 0) {
                                           from_date = that.get_date_from_seconds(time_obj['from_time'] - parseInt(server_data.trade_feed_delay));
                                           to_date = that.get_date_from_seconds(time_obj['to_time'] + parseInt(server_data.trade_feed_delay));
                                       }
                                   } else {
                                       from_date = that.get_date_from_seconds(time_obj['from_time'] - 5);
                                       to_date = that.get_date_from_seconds(time_obj['to_time']);
                                   }

                                   var display_marker = false;
                                   if(time_obj['to_time'] - time_obj['from_time'] <= _diff_end_start_time) {
                                       display_marker = true;
                                   }

                                   if(time_obj['force_tick']) {
                                       liveChartConfig.update({
                                           force_tick: true,
                                       });
                                   }

                                   liveChartConfig.update({
                                       interval: {
                                           from: from_date,
                                           to: to_date
                                       },
                                       with_markers: display_marker,
                                   });
                               }
                               configure_livechart();
                               updateLiveChart(liveChartConfig);
                               var barrier,
                                   purchase_time = $('#trade_details_purchase_date').attr('epoch_time');
                               if (!purchase_time) { // dont add barrier if its forward starting
                                   if(server_data.barrier && server_data.barrier2) {
                                       if (liveChartConfig.has_indicator('high')) {
                                           live_chart.remove_indicator('high');
                                       }
                                       barrier = new LiveChartIndicator.Barrier({ name: "high", value: server_data.barrier, color: 'green', label: text.localize('High Barrier')});
                                       live_chart.add_indicator(barrier);

                                       if (liveChartConfig.has_indicator('low')) {
                                           live_chart.remove_indicator('low');
                                       }
                                       barrier = new LiveChartIndicator.Barrier({ name: "low", value: server_data.barrier2, color: 'red', label: text.localize('Low Barrier')});
                                       live_chart.add_indicator(barrier);

                                   } else {
                                       if (liveChartConfig.has_indicator('barrier')) {
                                           live_chart.remove_indicator('barrier');
                                       }
                                       barrier = new LiveChartIndicator.Barrier({ name: "barrier", value: server_data.barrier, color: 'green', label: text.localize('Barrier')});
                                       live_chart.add_indicator(barrier);
                                   }
                               }
                               that.add_time_indicators(liveChartConfig);
                           }
                        }
                    });
                    that.model.currency(attr.model.currency());
                    that.model.shortcode(attr.model.shortcode());
                    that.model.payout(attr.model.payout());
                    that.model.purchase_price(attr.model.purchase_price());
                    that.clear_warnings();
                    var now_time_con = con.find('#now_time_container');
                    if (now_time_con.length > 0 ) {
                        var stream_url = server_data.stream_url + '/' + attr.model.sell_channel();
                        that.streaming.start(stream_url);
                        that.start_now_timer(con, 'now_time_container', 'trade_date_now'); // now timer
                        that.create_date_timer(con.find('#trade_details_now_date'));

                        var duration = now_time_con.attr('duration'); // need now duration to subtract from end duration
                        if(parseInt(duration) > 0) { // if now duration is positive then start the timer for end date
                            if(con.find('#end_time_container').attr('duration') !== '') {
                                duration = parseInt(con.find('#end_time_container').attr('duration')) - parseInt(duration);
                                if (duration > 0) {
                                    that.start_end_timer(con, 'end_time_container', 'now_time_container', 'trade_date_end', duration); // end timer
                                }
                            }
                        }
                    }
                    if (con.find($('#sell_price_container')).length > 0) {
                        that.sparkline.init(55);
                        con.on('click', '#sell_at_market', function (e) { e.preventDefault(); that.on_sell_button_click(e.target, element); return false; });
                    }
                    that.update_high_low(true);
                    that.reposition_confirmation();
               },
            })).always(function () {
                that.enable_button(dom_element);
            });
        },
        start_end_timer: function (con, end_attr_selector_id, now_attr_selector_id, container_id, duration) {
            var that = this;
            var time_container = con.find('#' + end_attr_selector_id);
            var now_time_container = con.find('#' + now_attr_selector_id);
            if (time_container.length > 0) {
                var time_obj = that.seconds_to_time(duration);
                var selected = 0;
                time_obj['is_inverse'] = 1;

                var text_year = text.localize('year');
                var text_years = text.localize('years');
                var text_month = text.localize('month');
                var text_months = text.localize('months');
                var text_day = text.localize('day');
                var text_days = text.localize('days');
                var text_hour = text.localize('hour');
                var text_hours = text.localize('hours');
                var text_minute = text.localize('minute');
                var text_minutes = text.localize('minutes');
                var text_second = text.localize('second');
                var text_seconds = text.localize('seconds');


                var interval = 1;
                var timer_input = {
                    year        : { value: time_obj.year, text: text_year, text_plural: text_years, interval: 31536000 },
                    month       : { value: time_obj.month, text: text_month, text_plural: text_months, interval: 2592000  },
                    day         : { value: time_obj.day, text: text_day, text_plural: text_days, interval: 86400 },
                    hour        : { value: time_obj.hour, text: text_hour, text_plural: text_hours, interval: 3600 },
                    minute      : { value: time_obj.minute, text: text_minute, text_plural: text_minutes, interval: 60 },
                    second      : { value: time_obj.second, text: text_second, text_plural: text_seconds, interval: 1 },
                    is_inverse  : time_obj['is_inverse'],
                };
                that.create_timer(con.find('#' + container_id), timer_input);

            }
        },
        start_now_timer: function (con, attr_selector_id, container_id) {
            var that = this;
            var time_container = con.find('#' + attr_selector_id);
            if (time_container.length > 0) {
                var time_obj = that.seconds_to_time(time_container.attr('duration'));

                var text_year = text.localize('year');
                var text_years = text.localize('years');
                var text_month = text.localize('month');
                var text_months = text.localize('months');
                var text_day = text.localize('day');
                var text_days = text.localize('days');
                var text_hour = text.localize('hour');
                var text_hours = text.localize('hours');
                var text_minute = text.localize('minute');
                var text_minutes = text.localize('minutes');
                var text_second = text.localize('second');
                var text_seconds = text.localize('seconds');

                var interval = 1;
                var timer_input = {
                    year        : { value: time_obj.year, text: text_year, text_plural: text_years, interval: 31536000 },
                    month       : { value: time_obj.month, text: text_month, text_plural: text_months, interval: 2592000  },
                    day         : { value: time_obj.day, text: text_day, text_plural: text_days, interval: 86400 },
                    hour        : { value: time_obj.hour, text: text_hour, text_plural: text_hours, interval: 3600 },
                    minute      : { value: time_obj.minute, text: text_minute, text_plural: text_minutes, interval: 60 },
                    second      : { value: time_obj.second, text: text_second, text_plural: text_seconds, interval: 1 },
                    is_negative : time_obj['is_negative'],
                };
                that.create_timer(con.find('#' + container_id), timer_input);
            }

        },
        get_params: function (element) {
            var params_arr = [];
            if (!element) return '';
            var attr = element.attributes;
            var j=0;
            for (var i = 0; i < attr.length; i++ ) {

                if (attr[i].name == 'class' || attr[i].name == 'onclick') {
                    continue;
                }

                params_arr[j] = attr[i].name+'='+encodeURIComponent(attr[i].value);
                j++;

            }
            return params_arr.join('&');
        },
        show_sell_at_market: function (data) {
            return this.show_inpage_popup('<div class="inpage_popup_content_box">' + data + '</div>');
        },
        on_sell_button_click: function (target, element) {
            this.disable_sell_button(true);
            this.streaming.stop();
            this.model.reload_page_on_close(true);
            this.show_loading();
            this.sell_bet(element);
        },
        cancel_previous_sell_request: function() {
            if (_sell_request) {
                _sell_request.abort();
            }
        },
        cancel_previous_analyse_request: function() {
            if (_analyse_request) {
                _analyse_request.abort();
            }
        },
        show_loading: function () {
            var con = this.container();
            var sell_info = $( con.find('#sell_info')[0] );
            var loading = this.get_loading_html();
            loading = $(loading);
            loading.show();
            sell_info.append(loading);
        },
        hide_loading: function () {
            var con = this.container();
            con.find('.loading').each( function () { $(this).hide().remove(); } );
        },
        sell_bet: function (element) {
            var that = this;
            var timeout = 60000;
            var attr = this.data_attr(element);
            var data = this.get_params(element) + '&ajax_only=1';
            data += '&price=' + $('input[name="price"]', $('#sell_price_container')).val();
            this.cancel_previous_sell_request();
            var submit_url = this.server_data().submit_url;
            _sell_request = $.ajax(ajax_loggedin({
                url     : submit_url,
                type    : 'POST',
                async   : true,
                data    : data,
                timeout : timeout,
                success : function (resp, resp_status, jqXHR) {
                    that.on_sell_bet_success(resp, resp_status, jqXHR);
                },
                error   : function (jqXHR, resp_status, exp) {
                    that.on_sell_bet_error(jqXHR, resp_status, exp);
                },
            }));
        },
        on_sell_bet_success: function (resp, resp_status, jqXHR) {
            var data = {};
            if (typeof resp == 'object') {
               data = resp;
            } else {
                data = (JSON && JSON.parse(resp)) || $.parseJSON(resp) || {};
            }
            this.hide_loading();
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            } else if (data.error) {
                this.show_warning(data.error, true);
            } else if (data.display) {
                this.clear_warnings();
                this.show_inpage_popup(data.display);
            } else {
                throw new Error("Invalid server response: " + data);
            }
        },
        on_sell_bet_error: function (jqXHR, resp_status, exp) {
            this.hide_loading();
            var details = '' + exp;
            if (jqXHR.responseText) {
                details += jqXHR.responseText;
            } else if (document.location.href.match(/^http:/) && (!details || details.match(/access/i))) {
                details += '<p>Please <a href="' + document.location.href.replace('http://', 'https://') + '">continue browsing using HTTPS secure protocol</a></p>';
            }
            this.show_warning(details, true);
        },
        register: function () {
            var that = this;
            $('#profit-table, #portfolio-table, #bet_container, #statement-table').on('click', '.open_contract_details', function (e) {
                var $this = $(this);
                e.preventDefault();
                _previous_button_clicked = this;
                that.disable_button($this);
                if (that.data_attr(this).model.tick_expiry()) {
                    that.only_show_chart(this);
                } else {
                    that.sell_at_market(this);
                }
                that.enable_button($this);
                return false;
            });
        },
        only_show_chart: function(element) {
            var that = this;
            var attr = that.data_attr(element);
            var params = that.get_params(element);

            _analyse_request = $.ajax(ajax_loggedin({
                url     : attr.url(),
                type    : 'POST',
                async   : true,
                data    : params,
                success : function (ajax_data) {
                    var data = ajax_data;
                    that.show_inpage_popup('<div class="inpage_popup_content_box"><div class="popup_bet_desc drag-handle">'+data.longcode+'</div><div id="tick_chart"></div></div>');
                    TickDisplay.initialize(data);
                },
            })).always(function() {
                that.enable_button($(element));
            });

        },
        data_attr: function (element) {
            var dom_element = $(element);
            return {
                selector: dom_element,
                url: function() { return dom_element.attr('url'); },
                model: {
                    shortcode: function() { return dom_element.attr('shortcode'); },
                    currency: function () { return dom_element.attr('currency'); },
                    purchase_price: function() { return dom_element.attr('purchase_price'); },
                    payout: function() { return dom_element.attr('payout'); },
                    sell_channel: function() { return dom_element.attr('sell_channel'); },
                    controller_action: function () { return dom_element.attr('controller_action'); },
                    tick_expiry: function() { return dom_element.attr('tick_expiry') || 0; }
                }, // data_attr.model
            };
        }, // data_attr
        streaming: function() {
            var _stream = null;
            var _update_from_stream = false;
            var _url = null;
            return {
                start: function(url) {
                    BetSell.sparkline.clear();
                    this.stop();
                    if (url) {
                        this._url = url;
                    }
                    _update_from_stream = true;
                    url = this._url;
                    if (url && typeof (EventSource) !== "undefined") {
                        this._stream = new EventSource(url, { retry: 18000000 });
                        var that = this;
                        this._stream.onmessage = function(e) {
                            that.process_message(e.data);
                        };
                        this._stream.addEventListener("ping", function(e) { return true; });
                        return true;
                    } else {
                        var err_msg = "We are not able to stream live prices at the moment. To enjoy live streaming of prices try refreshing the page, if you get this issue after repeated attempts try a different browser";
                        BetSell.show_warning(err_msg);
                        $('#spot_spark').html('<span title="' + err_msg + '">No Live price update</span>"');
                        return false;
                    }
                },
                stop: function() {
                    if (this._stream) {
                        this._stream.close();
                        this._stream = null;
                    }
                },
                ignore_updates: function() {
                    _update_from_stream = false;
                },
                process_message: function(data) {
                    if (_update_from_stream) {
                        var bet = JSON.parse(data);
                        var prices_len = bet.prices.length;
                        var spot = bet.spot;
                        var no_error = true;
                        for (var i = 0; i < prices_len; i++) {
                            prices = bet.prices[i];
                            if (!prices || prices.id != 'sell') {
                                continue;
                            }
                            if (prices.err) {
                                BetSell.show_warning(prices.err, true);
                                BetSell.disable_sell_button(true);
                                no_error = false;
                            } else {
                                BetSell.clear_warnings();
                                BetSell.enable_sell_button();
                            }
                            BetSell.update_price(prices);
                            BetSell.update_barriers(bet.barriers);
                            break; // just find the 'sell' id and then stop iteratiin on other prices
                        } // for
                        BetSell.update_spot(spot);
                    }
                }, // process_message
                url: function(val) {
                    if (val !== undefined) {
                        this._url = val;
                        return this;
                    }
                    return this._url;
                },
            };
        }(), // streaming
        sparkline: function() {
            var _values = [];
            var _length = 30;
            return {
                init:   function(length) {
                    _values = [];
                    if (length) {
                        _length = length;
                    }
                    var container = $(BetSell.container().find('#sell_price_container')[0]);
                    $('#sell_price_sparkline').remove();
                    var spark = $('<div id="sell_price_sparkline"></div>');
                    container.append(spark);
                    spark.show();
                    $('#sell_price_container').on('mouseover', '#sell_price_sparkline canvas', function () { $('#jqstooltip').css('z-index', get_highest_zindex() + 100); });
                },
                update: function(val) {
                    var that = this;
                    _values.push(val);
                    if (_values.length >= _length) {
                        _values.shift();
                    }
                    $('#sell_price_sparkline').sparkline(_values, that._config);
                },
                clear: function() {
                    var that = this;
                    _values = [];
                    $('#sell_price_sparkline').sparkline(_values, that._config);
                },
                _config: {
                    type: 'line',
                    lineColor: '#606060',
                    fillColor: false,
                    spotColor: '#00f000',
                    minSpotColor: '#f00000',
                    maxSpotColor: '#0000f0',
                    highlightSpotColor: '#ffff00',
                    highlightLineColor: '#000000',
                    spotRadius: 1.25
                },
            };
        }(), // sparkline
        create_timer: function (selector, input) { // input in form of obj have year : { value: 0, text: 'text', interval: 1}
            var duration_obj = {};
            var interval = 1;
            var that = this;
            if(input.year && input.year.value > 0) {
                duration_obj['year'] = input.year.value;
                interval = input.year.interval;
            }
            if(input.month && input.month.value > 0) {
                duration_obj['month'] = input.month.value;
                interval = input.month.interval;
            }
            if(input.day && input.day.value > 0) {
                duration_obj['day'] = input.day.value;
                interval = input.day.interval;
            }
            if(input.hour && input.hour.value > 0) {
                duration_obj['hour'] = input.hour.value;
                interval = input.hour.interval;
            }
            if(input.minute && input.minute.value > 0) {
                duration_obj['minute'] = input.minute.value;
                interval = input.minute.interval;
            }
            if(input.second && input.second.value > 0) {
                duration_obj['second'] = input.second.value;
                interval = input.second.interval;
            }

            var duration = moment.duration(duration_obj);
            _timer_interval_obj[Object.keys(_timer_interval_obj).length] = setInterval(function anonymous() {
                    var timestring;
                    var count = 0;

                    if (input['is_negative']) {
                        timestring = '- ';
                        duration = moment.duration(duration.asSeconds() - interval, 'seconds');
                    } else if (input['is_inverse']) {
                        timestring = '';
                        duration = moment.duration(duration.asSeconds() - interval, 'seconds');
                    } else {
                        timestring = '';
                        duration = moment.duration(duration.asSeconds() + interval, 'seconds');
                    }
                    var full_count_days =  Math.floor(duration.asDays());
                    if (full_count_days == 1 && count < 2) {
                        timestring += full_count_days + ' ' + input.day.text + ' ';
                        count++;
                    } else if (full_count_days > 1 && count < 2) {
                        timestring += full_count_days + ' ' + input.day.text_plural + ' ';
                        count++;
                    }
                    if (duration.hours() == 1 && count < 2) {
                        timestring += duration.hours() + ' ' + input.hour.text + ' ';
                        count++;
                    } else if (duration.hours() > 1 && count < 2) {
                        timestring += duration.hours() + ' ' + input.hour.text_plural + ' ';
                        count++;
                    }
                    if (duration.minutes() == 1 && count < 2) {
                        timestring += duration.minutes() + ' ' + input.minute.text + ' ';
                        count++;
                    } else if (duration.minutes() > 1 && count < 2) {
                        timestring += duration.minutes() + ' ' + input.minute.text_plural + ' ';
                        count++;
                    }

                    if (duration.seconds() == 1 && count < 2) {
                        timestring += duration.seconds() + ' ' + input.second.text;
                        count++;
                    } else if (duration.seconds() > 1 && count < 2) {
                        timestring += duration.seconds() + ' ' + input.second.text_plural;
                        count++;
                    } else if (duration.seconds() === 0 && count < 1) {
                        timestring += duration.seconds() + ' ' + input.second.text;
                        count++;
                    }

                    if (count === 0) {
                        that.resubmit_sell_at_market();
                    } else if (full_count_days === 0 && duration.hours() === 0 && duration.minutes() === 0 && duration.seconds() === 0) {
                        selector.html(timestring);
                        that.resubmit_sell_at_market();
                    } else {
                        selector.html(timestring);
                    }
                    return anonymous;
            }(), Math.abs(interval) * 1000);
        },
        create_date_timer: function(selector) {
            var interval = 1;
            var that = this;
            var epoch_time = parseInt(selector.attr('epoch_time')) + 1;
            _timer_interval_obj[Object.keys(_timer_interval_obj).length] = setInterval(function anonymous() {
                epoch_time += interval;
                var date = that.get_date_from_seconds(epoch_time);
                var mom = moment.utc(date).format('YYYY-MM-DD HH:mm:ss');
                selector.attr('epoch_time', epoch_time);
                selector.html(mom);
                return anonymous;
            },  Math.abs(interval) * 1000);
        },
        seconds_to_time: function(seconds) {
            var duration = moment.duration(Math.abs(parseInt(seconds)), 'seconds');
            var days, months;
            // as we dont use month in our date format
            if (duration.asDays() > 365) {
                days = duration.days();
                months = duration.months();
            } else {
                days = Math.floor(duration.asDays());
                months = 0;
            }
            var obj = {
                year: duration.years(),
                month: months,
                day: days,
                hour: duration.hours(),
                minute: duration.minutes(),
                second: duration.seconds(),
            };
            obj['is_negative'] = parseInt(seconds) < 0 ? 1 : 0;
            return obj;
        },
        get_date_from_seconds: function(seconds) {
            var date = new Date(seconds*1000);
            return date;
        },
        get_time_interval: function() {
            var time_obj = {};
            var start_time = $('#trade_details_start_date').attr('epoch_time');
            var purchase_time = $('#trade_details_purchase_date').attr('epoch_time');
            var now_time = $('#trade_details_now_date').attr('epoch_time');
            var end_time = $('#trade_details_end_date').attr('epoch_time');
            if(purchase_time) { // forward starting
                time_obj['from_time'] = parseInt(purchase_time);
                time_obj['to_time'] = parseInt(start_time);
            } else if(start_time && now_time) {
                if (now_time > start_time) {
                    if (((parseInt(end_time) - parseInt(start_time)) > 3600) && ((parseInt(now_time) - parseInt(start_time)) < 3600)) {
                        // check if end date is more than 1 hours and now time - start time is less than 1 hours
                        // in this case we switch back to tick chart rather than ohlc
                        time_obj['from_time'] = parseInt(start_time);
                        time_obj['to_time'] = parseInt(start_time) + 3595;
                    } else if ((parseInt(end_time) - parseInt(start_time)) === 3600) {
                        time_obj['from_time'] = parseInt(start_time);
                        time_obj['to_time'] = parseInt(end_time);
                        time_obj['force_tick'] = 1;
                    } else {
                        time_obj['from_time'] = parseInt(start_time);
                        time_obj['to_time'] = parseInt(end_time);
                    }
                }
            } else if (!now_time && start_time && end_time) { // bet has expired
                time_obj['from_time'] = parseInt(start_time);
                time_obj['to_time'] = parseInt(end_time);
            } else {
                time_obj['is_live'] = 1;
            }
            return time_obj;
        },
        add_time_indicators: function(liveChartConfig) {
            var that = this,
                indicator;
            var start_time = $('#trade_details_start_date').attr('epoch_time');
            var purchase_time = $('#trade_details_purchase_date').attr('epoch_time');
            var sold_time = $('#trade_details_sold_date').attr('epoch_time');
            var end_time = $('#trade_details_end_date').attr('epoch_time');
            var entry_spot_time = $('#trade_details_entry_spot_time').attr('epoch_time');
            if(purchase_time) {
                if (liveChartConfig.has_indicator('purchase_time')) {
                    live_chart.remove_indicator('purchase_time');
                }
                indicator = new LiveChartIndicator.Barrier({ name: "purchase_time", label: 'Purchase Time', value: that.get_date_from_seconds(parseInt(purchase_time)), color: '#e98024', axis: 'x'});
                live_chart.add_indicator(indicator);
            }

            if(start_time) {
                if (liveChartConfig.has_indicator('start_time')) {
                    live_chart.remove_indicator('start_time');
                }
                indicator = new LiveChartIndicator.Barrier({ name: "start_time", label: 'Start Time', value: that.get_date_from_seconds(parseInt(start_time)), color: '#e98024', axis: 'x'});
                live_chart.add_indicator(indicator);
            }

            if(entry_spot_time && entry_spot_time != start_time) {
                if (liveChartConfig.has_indicator('entry_spot_time')) {
                    live_chart.remove_indicator('entry_spot_time');
                }

                if (start_time && entry_spot_time < start_time) {
                    indicator = new LiveChartIndicator.Barrier({ name: "entry_spot_time", label: 'Entry Spot', value: that.get_date_from_seconds(parseInt(entry_spot_time)), color: '#e98024', axis: 'x'});
                } else {
                    indicator = new LiveChartIndicator.Barrier({ name: "entry_spot_time", label: 'Entry Spot', value: that.get_date_from_seconds(parseInt(entry_spot_time)), color: '#e98024', axis: 'x', nomargin: true});
                }
                live_chart.add_indicator(indicator);
            }

            if(end_time) {
                if (liveChartConfig.has_indicator('end_time')) {
                    live_chart.remove_indicator('end_time');
                }

                indicator = new LiveChartIndicator.Barrier({ name: "end_time", label: 'End Time', value: that.get_date_from_seconds(parseInt(end_time)), color: '#e98024', axis: 'x'});
                live_chart.add_indicator(indicator);
            }
            if(sold_time) {
                if (liveChartConfig.has_indicator('sold_time')) {
                    live_chart.remove_indicator('sold_time');
                }

                indicator = new LiveChartIndicator.Barrier({ name: "sold_time", label: 'Sell Time', value: that.get_date_from_seconds(parseInt(sold_time)), color: '#e98024', axis: 'x'});
                live_chart.add_indicator(indicator);
            }

        },
        add_overlay: function() {
            var overlay = $('#overlay-wrapper');
            overlay.show();
            overlay.css({
                height: $('#sell_content_container').outerHeight(true) + 'px',
                top: $('#sell_bet_desc').outerHeight() + 'px', // appending pixel because this height is already generated
            });
        },
    }; // BetSell
}();
;var PricingDetails = function() {
    return {
        register: function() {
            if(this.popup().length > 0) {
                this.on_open_debug_link();
                this.on_close();
            }
        },
        on_open_debug_link: function() {
            var that = this;
            $('a.pricing-details').on('click', function (event) {
                var popup = that.popup();
                popup.toggleClass('invisible');
                event.preventDefault();
            }).addClass('unbind_later');
        },
        on_close: function() {
            var that = this;
            $('a.pricing-details-close').on('click', function (event) {
                that.popup().addClass('invisible');
                event.preventDefault();
            }).addClass('unbind_later');
        },
        popup: function() {
            return $('#pricing_details_popup');
        }
    };
}();
;var TickDisplay = function() {
    return {
        reset: function() {
            var $self = this;
            $self.contract_barrier = null;
            $self.applicable_ticks = [];
            $self.number_of_ticks = null;
            $self.ev.close();
            $self.chart.destroy();
        },
        initialize: function(data) {
            var $self = this;

            // setting up globals
            $self.number_of_ticks = parseInt(data.number_of_ticks);
            $self.symbol = data.symbol;
            $self.display_symbol = data.display_symbol;
            $self.contract_start_ms = parseInt(data.contract_start * 1000);
            $self.contract_category = data.contract_category;
            $self.set_barrier = ($self.contract_category.match('digits')) ? false : true;
            $self.display_decimal = 0;
            var tick_frequency = 5;

            if (typeof data.decimal !== 'undefined') {
                $self.number_of_decimal = parseInt(data.decimal) + 1; //calculated barrier is rounded to one more decimal place
            }

            if (data.show_contract_result) {
                $self.show_contract_result = true;
                $self.contract_sentiment = data.contract_sentiment;
                $self.price = parseFloat(data.price);
                $self.payout = parseFloat(data.payout);
            }

            var minimize = data.show_contract_result;
            $self.set_x_indicators();

            $self.initialize_chart({
                plot_from: data.previous_tick_epoch * 1000,
                plot_to: new Date((parseInt(data.contract_start) + parseInt(($self.number_of_ticks+2)*tick_frequency)) * 1000).getTime(),
                minimize: minimize,
            });
        },
        set_x_indicators: function() {
            var $self = this;

            var exit_tick_index = $self.number_of_ticks - 1;
            if ($self.contract_category.match('asian')) {
                $self.ticks_needed = $self.number_of_ticks;
                $self.x_indicators = {
                    '_0': { label: 'Tick 1', id: 'start_tick'},
                };
                $self.x_indicators['_' + exit_tick_index] = {
                    label: 'Exit Spot',
                    id: 'exit_tick',
                };
            } else if ($self.contract_category.match('callput')) {
                $self.ticks_needed = $self.number_of_ticks + 1;
                $self.x_indicators = {
                    '_0': { label: 'Entry Spot', id: 'entry_tick'},
                };
                $self.x_indicators['_' + $self.number_of_ticks] = {
                    label: 'Exit Spot',
                    id: 'exit_tick',
                };
            } else if ($self.contract_category.match('digits')) {
                $self.ticks_needed = $self.number_of_ticks;
                $self.x_indicators = {
                    '_0': { label: 'Tick 1', id: 'start_tick'},
                };
                $self.x_indicators['_' + exit_tick_index] = {
                    label:  'Tick ' + $self.number_of_ticks,
                    id: 'last_tick',
                };
            } else {
                $self.x_indicators = {};
            }

        },
        initialize_chart: function(config) {
            var $self = this;

            $self.chart = new Highcharts.Chart({
                chart: {
                    type: 'line',
                    renderTo: 'tick_chart',
                    width: config.minimize ? 394 : null,
                    height: config.minimize ? 143 : null,
                    backgroundColor: null,
                    events: { load: $self.plot(config.plot_from, config.plot_to) },
                },
                credits: {enabled: false},
                tooltip: {
                    formatter: function () {
                        var that = this;
                        var new_decimal = that.y.toString().split('.')[1].length;
                        var decimal_places = Math.max( $self.display_decimal, new_decimal);
                        $self.display_decimal = decimal_places;
                        var new_y = that.y.toFixed(decimal_places);
                        var mom = moment.utc($self.applicable_ticks[that.x].epoch*1000).format("dddd, MMM D, HH:mm:ss");
                        return mom + "<br/>" + $self.display_symbol + " " + new_y;
                    },
                },
                xAxis: {
                    type: 'linear',
                    min: 0,
                    max: $self.number_of_ticks + 1,
                    labels: { enabled: false, }
                },
                yAxis: {
                    opposite: false,
                    labels: {
                        align: 'left',
                        x: 0,
                    },
                    title: ''
                },
                series: [{
                    data: [],
                }],
                title: '',
                exporting: {enabled: false, enableImages: false},
                legend: {enabled: false},
            });
        },
        plot: function(plot_from, plot_to) {
            var $self = this;

            var plot_from_moment = moment(plot_from).utc();
            var plot_to_moment = moment(plot_to).utc();
            var contract_start_moment = moment($self.contract_start_ms).utc();
            $self.counter = 0;
            $self.applicable_ticks = [];

            var symbol = $self.symbol;
            var stream_url = window.location.protocol + '//' + page.settings.get('streaming_server');
            stream_url += "/stream/ticks/" + symbol + "/" + plot_from_moment.unix() + "/" + plot_to_moment.unix();
            $self.ev = new EventSource(stream_url, { withCredentials: true });

            $self.ev.onmessage = function(msg) {
                if ($self.applicable_ticks.length >= $self.ticks_needed) {
                    $self.ev.close();
                    $self.evaluate_contract_outcome();
                    return;
                }

                var data = JSON.parse(msg.data);
                if (data && !(data[0] instanceof Array)) {
                    data = [ data ];
                }
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i][0] === 'tick') {
                            var tick = {
                                epoch: parseInt(data[i][1]),
                                quote: parseFloat(data[i][2])
                            };

                            if (tick.epoch > contract_start_moment.unix()) {
                                if ($self.applicable_ticks.length >= $self.ticks_needed) {
                                    $self.ev.close();
                                    $self.evaluate_contract_outcome();
                                    return;
                                } else {
                                    if (!$self.chart) return;
                                    if (!$self.chart.series) return;
                                    $self.chart.series[0].addPoint([$self.counter, tick.quote], true, false);
                                    $self.applicable_ticks.push(tick);
                                    var indicator_key = '_' + $self.counter;
                                    if (typeof $self.x_indicators[indicator_key] !== 'undefined') {
                                        $self.x_indicators[indicator_key]['index'] = $self.counter;
                                        $self.add($self.x_indicators[indicator_key]);
                                    }

                                    $self.add_barrier();
                                    $self.apply_chart_background_color(tick);
                                    $self.counter++;
                                }
                            }

                        }
                    }
                }
            };
            $self.ev.onerror = function(e) {$self.ev.close(); };
        },
        apply_chart_background_color: function(tick) {
            var $self = this;

            var chart_container = $('#tick_chart');
            if ($self.contract_sentiment === 'up') {
                if (tick.quote > $self.contract_barrier) {
                    chart_container.css('background-color', 'rgba(46,136,54,0.198039)');
                } else {
                    chart_container.css('background-color', 'rgba(204,0,0,0.098039)');
                }
            } else if ($self.contract_sentiment === 'down') {
                if (tick.quote < $self.contract_barrier) {
                    chart_container.css('background-color', 'rgba(46,136,54,0.198039)');
                } else {
                    chart_container.css('background-color', 'rgba(204,0,0,0.098039)');
                }
            }
        },
        add_barrier: function() {
            var $self = this;

            if (!$self.set_barrier) {
                return;
            }

            var barrier_type = $self.contract_category.match('asian') ? 'asian' : 'static';

            if (barrier_type === 'static') {
                var barrier_tick = $self.applicable_ticks[0];
                $self.chart.yAxis[0].addPlotLine({
                    id: 'tick-barrier',
                    value: barrier_tick.quote,
                    label: {text: 'Barrier ('+barrier_tick.quote+')', align: 'center'},
                    color: 'green',
                    width: 2,
                });
                $self.contract_barrier = barrier_tick.quote;
                $self.set_barrier = false;
            }

            if (barrier_type === 'asian') {
                var total = 0;
                for (var i=0; i < $self.applicable_ticks.length; i++) {
                    total += parseFloat($self.applicable_ticks[i].quote);
                }
                var calc_barrier =  total/$self.applicable_ticks.length;
                calc_barrier = calc_barrier.toFixed($self.number_of_decimal); // round calculated barrier

                $self.chart.yAxis[0].removePlotLine('tick-barrier');
                $self.chart.yAxis[0].addPlotLine({
                    id: 'tick-barrier',
                    value: calc_barrier,
                    color: 'green',
                    label: {
                        text: 'Average ('+calc_barrier+')',
                        align: 'center'
                    },
                    width: 2,
                });
                $self.contract_barrier = calc_barrier;
            }
        },
        add: function(indicator) {
            var $self = this;

            $self.chart.xAxis[0].addPlotLine({
               value: indicator.index,
               id: indicator.id,
               label: {text: indicator.label},
               color: '#e98024',
               width: 2,
            });
        },
        evaluate_contract_outcome: function() {
            var $self = this;

            if (!$self.contract_barrier) {
                return; // can't do anything without barrier
            }

            var exit_tick_index = $self.applicable_ticks.length - 1;
            var exit_spot = $self.applicable_ticks[exit_tick_index].quote;

            if ($self.contract_sentiment === 'up') {
                if (exit_spot > $self.contract_barrier) {
                    $self.win();
                } else {
                    $self.lose();
                }
            } else if ($self.contract_sentiment === 'down') {
                if (exit_spot < $self.contract_barrier) {
                    $self.win();
                } else {
                    $self.lose();
                }
            }

        },
        win: function() {
            var $self = this;

            var profit = $self.payout - $self.price;
            $self.update_ui($self.payout, profit, text.localize('This contract won'));
        },
        lose: function() {
            var $self = this;
            $self.update_ui(0, -$self.price, text.localize('This contract lost'));
        },
        update_ui: function(final_price, pnl, contract_status) {
            var $self = this;

            $('#bet-confirm-header').text(text.localize(contract_status));
            $('#contract-outcome-buyprice').text($self.to_monetary_format($self.price));
            $('#contract-outcome-payout').text($self.to_monetary_format(final_price));

            if (pnl > 0) {
                $('#contract-outcome-label').removeClass('standin loss').addClass('standout profit').text(text.localize('Profit'));
                $('#contract-outcome-profit').removeClass('standin loss').addClass('standout profit').text($self.to_monetary_format(pnl));
            } else {
                $('#contract-outcome-label').removeClass('standout profit').addClass('standin loss').text(text.localize('Loss'));
                $('#contract-outcome-profit').removeClass('standout profit').addClass('standin loss').text($self.to_monetary_format(pnl));
            }
            $('#confirmation_table').hide();
            $('#contract-outcome-details').show();
        },
        to_monetary_format: function(number) {
            return number.toFixed(2);
        }
    };
}();
;var load_chart_app = function () {
    var isMac = /Mac/i.test(navigator.platform),
        isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isAndroid = /Android/i.test(navigator.userAgent),
        isWindowsPhone = /Windows Phone/i.test(navigator.userAgent),
        isJavaInstalled = navigator.javaEnabled(),
        isMobile = isIOS || isAndroid || isWindowsPhone,
        shouldBeInstalled = !isJavaInstalled && !isMobile;

    $('#install-java').toggle(shouldBeInstalled);
    $('#download-app').toggle(isJavaInstalled);

    $('#download-app').on('click', function () {
        if (isMac) {
            alert('You need to change your security preferences!');
            return;
        }

        if (isMobile) {
            alert('The charting app is not available on mobile devices!');
        }
    });
};
;var client_form;
onLoad.queue(function() {
        client_form = new ClientForm({restricted_countries: page.settings.get('restricted_countries'), valid_loginids: page.settings.get('valid_loginids')});
});

pjax_config_page('new_real', function() {
    return {
        onLoad: function() {
            client_form.on_residence_change();
            select_user_country();
            if(page.client.is_logged_in) {
                client_form.set_virtual_email_id(page.client.email);
            }
        }
    };
});

var upgrade_investment_disabled_field = function () {
    var fields = ['mrms', 'fname', 'lname', 'dobdd', 'dobmm', 'dobyy', 'residence', 'secretquestion', 'secretanswer'];
    fields.forEach(function (element, index, array) {
        var obj = $('#'+element);
        if (obj.length > 0) {
            $('#'+element).attr('disabled', true);
        }
    });
};

var enable_fields_form_submit = function () {
    var fields = ['mrms', 'fname', 'lname', 'dobdd', 'dobmm', 'dobyy', 'residence', 'secretquestion', 'secretanswer'];
    $('form#openAccForm').submit(function (event) {
        fields.forEach(function (element, index, array) {
            var obj = $('#'+element);
            if (obj.length > 0) {
                obj.removeAttr('disabled');
            }
        });
    });
};

var hide_account_opening_for_risk_disclaimer = function () {
    var risk_section = $('#risk_disclaimer_section');
    if (risk_section.length > 0) {
        $('.formObject fieldset').not("#risk_disclaimer_section").hide();
    }
};

pjax_config_page('new_financial', function() {
    return {
        onLoad: function() {
            upgrade_investment_disabled_field();
            enable_fields_form_submit();
            hide_account_opening_for_risk_disclaimer();
        }
    };
});

pjax_config_page('user/assessment', function() {
    return {
        onLoad: function() {
            hide_account_opening_for_risk_disclaimer();
        }
    };
});
;var ClientForm = function(init_params) {
    this.restricted_countries = new RegExp(init_params['restricted_countries']);
    this.valid_loginids = new RegExp(init_params['valid_loginids']);
};

ClientForm.prototype = {
    validate_post_code: function() {
        var residence = $( 'select[name=residence]').val();
        var postcode = $( 'input[name=AddressPostcode]').val();
        if (residence == 'gb' && !postcode.length) {
            return false;
        }
        return true;
    },
    validate_DOB: function() {
        var dd = $( 'select#dobdd').val();
        var mm = $( 'select#dobmm').val();
        mm = parseInt(mm) - 1;
        var yy = $( 'select#dobyy').val();

        var dob = new Date(yy, mm, dd);
        if (dob.getDate() != dd || dob.getMonth() != mm || dob.getFullYear() != yy) {
            return false;
        } else {
            return true;
        }
    },
    compare_new_password: function(new_password1, new_password2) {
        if (new_password1.length > 0 && new_password2.length > 0)
            {
                if (new_password1 != new_password2) {
                    return false;
                }
            }
            return true;
    },
    is_allowed_opening_account_country: function(selected_country) {
        var error_residence = clearInputErrorField('errorresidence');
        if (this.restricted_countries.test(selected_country)) {
            error_residence.innerHTML = text.localize('We are not accepting accounts from residents of this country at the present time.');
            return false;
        }

        error_residence.innerHTML = '';
        return true;
    },
    tnc_accepted: function (bValid) {
            var input_tnc = document.getElementById('tnc');
            var error_tnc = clearInputErrorField('errortnc');
            if (input_tnc && error_tnc) {
                    if (input_tnc.checked === false)
                    {
                            error_tnc.innerHTML = text.localize('You must accept the terms and conditions to open an account.');
                            return false;
                    }
            }
            return true;
    },
    check_ip: function(IPSecurity)
    {
            var regexp_IPSecurity = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
            var ipArray = IPSecurity.match(regexp_IPSecurity);
            if (ipArray) {
                    for (i = 0; i < ipArray.length; i++) {
                            if (ipArray[i] > 255) {
                                    return false;
                            }
                    }
            }
            return true;
    },
    fixLoginID: function() {
        var loginid = $('#LoginForm_loginID');
        var loginid_value = loginid.val();

        loginid_value = loginid_value.toUpperCase();
        loginid_value = loginid_value.replace(/\\s/g,'');

        loginid.val(loginid_value);
    },
    is_loginid_valid: function(login_id) {
        if (login_id.length > 0) {
            login_id = login_id.toUpperCase();
            return this.valid_loginids.test(login_id);
        }

        return true;
    },
    self_exclusion: function() {
        return {
            has_something_to_save: function(init) {
                var el, i;
                var names = ['MAXCASHBAL', 'MAXOPENPOS',
                             'DAILYTURNOVERLIMIT', 'DAILYLOSSLIMIT',
                             '7DAYTURNOVERLIMIT', '7DAYLOSSLIMIT',
                             'SESSIONDURATION', 'EXCLUDEUNTIL'];
                for (i=0; i<names.length; i++) {
                    el = document.getElementById(names[i]);
                    if (el) {
                        el.value = el.value.replace(/^\s*/, '').replace(/\s*$/, '');
                        if (el.value == (init[names[i]]===undefined ? '' : init[names[i]])) continue;
                        return true;
                    }
                }
                return false;
            },
            validate_exclusion_date: function() {
                var exclusion_date = $('#EXCLUDEUNTIL').val();

                if (exclusion_date) {
                    var error_element_errorEXCLUDEUNTIL = clearInputErrorField('errorEXCLUDEUNTIL');

                    exclusion_date = new Date(exclusion_date);
                    // self exclusion date must >= 6 month from now
                    var six_month_date = new Date();
                    six_month_date.setMonth(six_month_date.getMonth() + 6);

                    if (exclusion_date < six_month_date) {
                        error_element_errorEXCLUDEUNTIL.innerHTML = text.localize("Please enter a date that is at least 6 months from now.");
                        return false ;
                    }

                    if (confirm(text.localize("When you click 'Ok' you will be excluded from trading on the site until the selected date.")) === true) {
                        return true;
                    } else {
                        return false;
                    }

                }

                return true;
            },
        };
    }(),
    set_idd_for_residence: function(residence) {
        var tel = $('#Tel');
        if (!tel.val() || tel.val().length < 6) {
            var idd_code = idd_codes[residence];
            tel.val(idd_code ? '+' + idd_code : '');
        }
    },
    on_residence_change: function() {
        var that = this;
        $('#residence').on('change', function() {
            that.set_idd_for_residence($(this).val());
            var address_state = $('#AddressState');
            var current_state = address_state.length > 0 ? address_state.val() : '';

            var postcodeLabel = $('label[for=AddressPostcode]');
            if ($(this).val() == 'GB') {
                postcodeLabel.prepend('<em class="required_asterisk">* </em>');
            } else {
                postcodeLabel.find('em').remove();
            }

            if(that.is_allowed_opening_account_country($(this).val())) {
                $.ajax({
                    crossDomain:true,
                    url: page.url.url_for('states_list'),
                    data: {"c":$('#residence').get(0).value,"l": page.language()},
                    async: true,
                    dataType: "html"
                }).done(function(response) {
                    $('#AddressState').html(response);
                    that.hide_state_list_if_empty(current_state);
                });
            } else {
                $("#AddressState").parents(".row").first().hide(); //Hide States list.
            }
        });
    },
    hide_state_list_if_empty: function(current_state) {
        var addr_state = $("#AddressState");
        if (addr_state.children().size() > 2) {
            addr_state.parents(".row").first().show();
            addr_state.val(current_state);
        } else {
            addr_state.parents(".row").first().hide();
        }
    },
    set_virtual_email_id: function(email) {
        $('#Email').val(email);
        $('#Email').disableSelection();
    }
};
;var get_ticker = function() {
    var ticker = $('#hometicker');
    if (ticker.size()) {
        $.ajax({ crossDomain: true, url: page.url.url_for('ticker'), async: true, dataType: "html" }).done(function(ticks) {
            ticker.html(ticks);
            ticker.find('ul').simplyScroll();
        });
    }
};


var select_user_country = function() {
    if($('#residence').length > 0) {
        get_user_country(function() {
            var restricted_countries = new RegExp(page.settings.get('restricted_countries'));
            var current_selected = $('#residence').val() || this.country;
            if(restricted_countries.test(current_selected)) {
                $('#residence').val('default').change();
            } else {
                $('#residence').val(current_selected).change();
            }
        });
    }
};

var Charts = function(charts) {
    window.open(charts, 'DetWin', 'width=580,height=710,scrollbars=yes,location=no,status=no,menubar=no');
};

var email_rot13 = function(str) {
    return str.replace(/[a-zA-Z]/g, function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
};

var display_cs_contacts = function () {
    $('.contact-content').on("change", '#cs_telephone_number', function () {
        var val = $(this).val();
        $('#display_cs_telephone').html('<a href="tel:' + val + '">' + val + '</a>');
    });
    $('#cs_contact_eaddress').html(email_rot13("<n uers=\"znvygb:fhccbeg@ovanel.pbz\" ery=\"absbyybj\">fhccbeg@ovanel.pbz</n>"));
};

var change_chat_icon = function () {
  // desk.com change icon - crude way
  var len = $('#live-chat-icon').length;
  if( len > 0 ) {
      var timer = null;
      var updateIcon =  function () {
          var image_link = page.settings.get('image_link');
          var desk_widget = $('.a-desk-widget');
          var image_str = desk_widget.css('background-image');
          if(image_str) {
              desk_widget.css({
                  'background-image': 'url("' + image_link['livechaticon'] + '")',
                  'background-size': 'contain',
                  'min-width': 35,
                  'min-height': 35,
                  'width': 'auto'
              });
              desk_widget.hover(function() {
                  $(this).css({
                      'background': 'url("' + image_link['livechaticon'] + '") no-repeat scroll 0 0',
                      'background-size': 'contain',
                  });
              });

              if(image_str.match(/live-chat-icon/g)){
                  clearInterval(timer);
              }
          }
      };
      timer = setInterval(updateIcon, 500);
  }
};

var render_desk_widget = function() {
       new DESK.Widget({
                version: 1,
                site: 'binary.desk.com',
                port: '80',
                type: 'chat',
                id: 'live-chat-icon',
                displayMode: 0,  //0 for popup, 1 for lightbox
                features: {
                        offerAlways: true,
                        offerAgentsOnline: false,
                        offerRoutingAgentsAvailable: false,
                        offerEmailIfChatUnavailable: false
                },
                fields: {
                        ticket: {
                                // desc: &#x27;&#x27;,
                // labels_new: &#x27;&#x27;,
                // priority: &#x27;&#x27;,
                // subject: &#x27;&#x27;,
                // custom_loginid: &#x27;&#x27;
                        },
                        interaction: {
                                // email: &#x27;&#x27;,
                // name: &#x27;&#x27;
                        },
                        chat: {
                                //subject: ''
                        },
                        customer: {
                                // company: &#x27;&#x27;,
                // desc: &#x27;&#x27;,
                // first_name: &#x27;&#x27;,
                // last_name: &#x27;&#x27;,
                // locale_code: &#x27;&#x27;,
                // title: &#x27;&#x27;,
                // custom_loginid: &#x27;&#x27;
                        }
                }
        }).render();
};

var show_live_chat_icon = function() {
    if(typeof DESK === 'undefined') {
        loadCSS("https://d3jyn100am7dxp.cloudfront.net/assets/widget_embed_191.cssgz?1367387331");
        loadJS("https://d3jyn100am7dxp.cloudfront.net/assets/widget_embed_libraries_191.jsgz?1367387332");
    }


    var desk_load = setInterval(function() {
        if(typeof DESK !== "undefined") {
            render_desk_widget();
            change_chat_icon();
            clearInterval(desk_load);
        }
    }, 80);
};

var display_career_email = function() {
    $("#hr_contact_eaddress").html(email_rot13("<n uers=\"znvygb:ue@ovanel.pbz\" ery=\"absbyybj\">ue@ovanel.pbz</n>"));
};

pjax_config_page('/$|/home', function() {
    return {
        onLoad: function() {
            select_user_country();
            get_ticker();
        }
    };
});

pjax_config_page('/why-us', function() {
    return {
        onLoad: function() {
            var whyus = $('.why-us');
            sidebar_scroll(whyus);
        },
        onUnload: function() {
            $(window).off('scroll');
        }
    };
});

pjax_config_page('/smart-indices', function() {
    return {
        onLoad: function() {
            sidebar_scroll($('.smart-indices'));
        },
        onUnload: function() {
            $(window).off('scroll');
        }
    };
});

pjax_config_page('/open-source-projects', function() {
    return {
        onLoad: function() {
            sidebar_scroll($('.open-source-projects'));
        },
        onUnload: function() {
            $(window).off('scroll');
        }
    };
});

pjax_config_page('/white-labels', function() {
    return {
        onLoad: function() {
            sidebar_scroll($('.white-labels'));
        },
        onUnload: function() {
            $(window).off('scroll');
        }
    };
});

pjax_config_page('/partnerapi', function() {
    return {
        onLoad: function() {
            var partnerapi = $('.partnerapi-content');
            sidebar_scroll(partnerapi);
        },
        onUnload: function() {
            $(window).off('scroll');
        }
    };
});

pjax_config_page('/get-started', function() {
    return {
        onLoad: function() {
            get_started_behaviour();
        },
        onUnload: function() {
            $(window).off('scroll');
        },
    };
});

pjax_config_page('/contact', function() {
    return {
        onLoad: function() {
            display_cs_contacts();
            show_live_chat_icon();
        },
    };
});

pjax_config_page('/careers', function() {
    return {
        onLoad: function() {
            $("#hr_contact_eaddress")
                .html(email_rot13("<n uers=\"znvygb:ue@ovanel.pbz\" ery=\"absbyybj\">ue@ovanel.pbz</n>"));
        },
    };
});
;var minDT = new Date();
minDT.setUTCFullYear(minDT.getUTCFullYear - 3);
var liveChartsFromDT, liveChartsToDT, liveChartConfig;

var $liveChartFromDate, $liveChartToDate;

var updateDatesFromConfig = function(config) {
    var duration = $('#live_chart_duration li[data-live=' + config.live + ']').attr('id');

    $liveChartFromDate.set('value', moment().subtract(duration, 'seconds').toDate());
    $liveChartToDate.set('value', moment().toDate());
};

var show_chart_for_instrument = function() {
    var symb, disp_symb;
    $("#instrument_select .deleteme").remove();
    $("#instrument_select option:selected").each(function(){
        symb = $(this).val();
        disp_symb = $(this).text();
    });

    if (symb) {
        liveChartConfig.update({
            symbol: symb,
            update_url: 1
        });
        updateLiveChart(liveChartConfig);
    }
};

var remove_highlight_chart_duration = function () {
    $('#live_chart_duration').find('.live_charts_stream_button').each( function () {
        $(this).find('span').removeClass('current');
    });
};

var build_markets_select = function() {
    var market_select = $("#market_select");
    markets.each(function() {
        market_select.append("<option id='opt_" + this.name + "' value='" + this.name + "'>" + this.translated_display_name() + "</option>");
    });

    $("#market_select").val(liveChartConfig.market.name);
    build_instrument_select();

    $("#market_select").change(build_instrument_select);
};

var build_instrument_select = function() {
    var instrument_select = $("#instrument_select");
    var market = markets.get($('#market_select').val());
    $("#instrument_span").hide();
    if(market) {
        $("#instrument_select option").remove();
        instrument_select.append("<option class='deleteme'></option>");
        market.each(function() {
            this.each(function() {
                instrument_select.append("<option value='" + this.symbol + "'>" + this.translated_display_name() + "</option>");
            });
        });
        $("#instrument_span").show();
        $("#instrument_select").change(show_chart_for_instrument);
        $("#instrument_select").val(liveChartConfig.symbol.symbol);
    }
};

var init_live_chart = function () {

    $liveChartFromDate = $('#live_charts_from_date').pickadate().pickadate('picker');
    $liveChartToDate = $('#live_charts_to_date').pickadate().pickadate('picker');

/*
    $('#live_charts_from').pickadate({
        onSet: function(context) {
            $('#live_charts_from').pickadate({
                max: $('#live_charts_to').pickadate().val()
            });
        }
    });

    $('#live_charts_to').pickadate({
        onSet: function(context) {
            $('#live_charts_from').pickadate({
                max: $('#live_charts_from').pickadate().val()
            });
        }
    });
*/
    liveChartConfig = new LiveChartConfig({
        renderTo: 'live_chart_div',
    });

    configure_livechart();
    build_markets_select();


    $(".notice").hide();
    $("#live_charts_high_barrier").change(function(){
        var val = $(this).val();
        if(liveChartConfig.has_indicator('high') || !val) {
            live_chart.remove_indicator('high');
        }

        if (val) {
            var barrier = new LiveChartIndicator.Barrier({ name: "high", value: val, color: 'green'});
            live_chart.add_indicator(barrier);
        }
    });
    $("#live_charts_low_barrier").change(function(){
        var val = $(this).val();
        if(liveChartConfig.has_indicator('low') || !val) {
            live_chart.remove_indicator('low');
        }

        if (val) {
            var barrier = new LiveChartIndicator.Barrier({ name: "low", value: val, color: 'red'});
            live_chart.add_indicator(barrier);
        }
    });


    $('#live_charts_hide_spot').hide();
    $("#live_charts_show_spot").on('click', function(e){
        e.preventDefault();
        var barrier = new LiveChartIndicator.Barrier({ name: "spot", value: "+0"});
        live_chart.add_indicator(barrier);
        $(this).hide();
        $('#live_charts_hide_spot').show();
    });

    $("#live_charts_hide_spot").on('click', function(e){
        e.preventDefault();
        live_chart.remove_indicator('spot');
        $(this).hide();
        $('#live_charts_show_spot').show();
    });

    $("#live_charts_show_interval").on('click', function() {
        liveChartConfig.update({
            interval: {
                from: $liveChartFromDate.get('value'),
                to: $liveChartToDate.get('value')
            },
            update_url: 1
        });
        updateLiveChart(liveChartConfig);
    });

    $("#live_chart_duration").on('duration_change', function(e) {
        updateDatesFromConfig(e.config);
    });

    show_chart_for_instrument();
    updateDatesFromConfig(liveChartConfig);
};


pjax_config_page('livechart', function() {
    return {
        onLoad: function() {
            init_live_chart();
        },
        onUnload: function() {
            live_chart.close_chart();
        }
    };
});

//The first time someone loads live chart in the session, the script might not have finished loading by the time onLoad.fire() was called.
//So we check if livechart was not configured when we loaded this script then we initialize it manually.
$(function() {
    if(!live_chart && /livechart/.test(window.location.pathname)) {
        init_live_chart();
    }

});
;function currencyConvertorCalculator()
{
    var currencyto = document.getElementById('currencyto');
    if (currencyto.options.length > 0)
    {
        currencyto.options.length = 0;
    }

    var i=0;
    $('#currencyfrom').find('option').each(function(){
        if (this.selected !== true)
        {
            currencyto.options[i] = new Option(this.value, this.text);
            i++;
        }
    });

    return true;
}

function checkCurrencyAmountFormat(input_value)
{
    var amount = $(input_value).val();
    var amountEXP = '^\\d+(\\.)?(\\d)?(\\d)?$';
    var amountRex = new RegExp(amountEXP);
    var displayerror = $('#currencyconverterror');
    var currencysubmit = $('#currencysubmit');

    if (amount === '')
    {
        displayerror.addClass('invisible button-disabled');
        currencysubmit.attr('disabled', 'disabled').addClass('button-disabled').parents('.button').addClass('button-disabled');
        return 1;
    }

    if (!amountRex.test(amount) && displayerror)
    {
        displayerror.removeClass('invisible');
        currencysubmit.attr('disabled', 'disabled').addClass('button-disabled').parents('.button').addClass('button-disabled');
    }
    else
    {
        displayerror.addClass('invisible');
        currencysubmit.removeAttr('disabled').removeClass('button-disabled').parents('.button').removeClass('button-disabled');
    }

    return false;
}

var Portfolio = function () {
    var _price_request = null;
    var elements = $('button.open_contract_details');
    return {
        update_indicative_prices: function() {
            if(!page.client.is_logged_in) {
                window.location.href = page.url.url_for('login');
                return;
            }

            this.cancel_price_request();
            var that = this;
            if ($.isEmptyObject(elements)) return; // There are no open positions we will be able to update.
            _price_request = $.ajax(ajax_loggedin({
                url     : '/d/trade.cgi',
                type    : 'POST',
                async   : true,
                data    : 'controller_action=open_position_values',
                timeout : 60000,
                success : that.on_price_request_success,
                error   : that.on_price_request_error,
            }));
        },
        cancel_price_request: function() {
            if (_price_request) {
                _price_request.abort();
            }
        },
        on_price_request_success: function(resp, resp_status, jqXHR) {
            var data = {};
            var prices = {};
            if (typeof resp == 'object') {
               data = resp;
            } else {
                data = (JSON && JSON.parse(resp)) || $.parseJSON(resp) || {};
            }
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            } else if (data.error) {
                return;         // Something went wrong, just leave the cached version in place, it says indicative.
            } else if (data.prices) {
                prices = data.prices;
            } else {
                console.log(data);
                var exception = new Error("Invalid server response: " + data);
                Portfolio.on_price_request_error(jqXHR, resp_status, exception);
            }
            Portfolio.set_contract_prices(prices);
        },
        on_price_request_error: function(jqXHR, resp_status, exp) {
            return;         // Something went wrong, just leave the cached version in place, it says indicative.
        },
        set_contract_prices: function(prices) {
            var that = this;
            var default_price = ((prices && prices['*']) ? prices['*'] : null);
            var _update_element_price = function() {
                var el = $(this);
                var price;
                data = element_data_attrs(el);
                var shortcode = data.shortcode;
                var currency = data.currency;
                if (!prices[currency]) {
                    if (default_price !== null) {
                        prices[currency] = {};
                    } else {
                        return;
                    }
                }
                if (default_price !== null && prices[currency][shortcode] === undefined) {
                    prices[currency][shortcode] = default_price;
                }
                price = prices[currency][shortcode];
                if (price !== undefined) {
                    if (isNaN(price)) {
                        /* price is not a number, could be an error report. do not use currency nor update
                         * the price attr of the button. just update portfolio table value shown to user
                         */
                        $('p', el.parents('div').children('div')[2]).text(price);
                    } else {
                        el.attr('price', price);
                        price = stylized_price(price);
                        price = price.units + price.cents;
                        $('p', el.parents('div').children('div')[2]).text(currency + ' ' + price);
                    }
                }
            };
            elements.each(_update_element_price);
        }
    };
}();

pjax_config_page('portfolio', function() {
    return {
        onLoad: function() {
            $('#portfolio-table .hourglass').hide();
            $('#currencyfrom').change(function(event) { currencyConvertorCalculator(event.target); });
            $('#currencyfrom').keyup(function(event) { currencyConvertorCalculator(event.target); });
            $('#currencyfromvalue').change(function(event) { checkCurrencyAmountFormat(event.target); });
            $('#currencyfromvalue').keyup(function(event) { checkCurrencyAmountFormat(event.target); });
            Portfolio.update_indicative_prices();
        }
    };
});
;var calculate_button_event = function() {
    $('#pricingtable_calculate').on('click', function(e) {
        e.preventDefault();
        var form = $('form[name=pricing_table_input]').get(0);
        var url = page.url.url_for('resources/pricing_table', getFormParams(form));
        $('#pricingtable_calculate').hide();
        $('#pricingtable_calculating').show();
        $('#pricing_table_prices_div').html('');
        $.ajax({
            url: url,
            data: {
                ajax_only: 1,
                prices_only: 1,
            },
        }).done(function(response) {
            $('#pricing_table_prices_div').html(response);
            page.url.update(url);
            $('#pricingtable_calculating').hide();
            $('#pricingtable_calculate').show();
            initTabs();
        });
    });
};

var bet_type_select = function() {
    $('#pricing_table_input').find('select[name="bet_type"]').on('change', function() {
        var bet_type = $(this).val();
        var double_barriers = ["RANGE", "UPORDOWN", "EXPIRYRANGE", "EXPIRYMISS"];
        var is_double_barrier = 0;

        for (var i = 0; i < double_barriers.length; i++) {
            if (bet_type == double_barriers[i]) {
                is_double_barrier = 1;
                break;
            }
        }
        if (is_double_barrier == 1) {
            $("#lower_strike").show();
            $("#high_strike_label").show();
            $("#strike_label").hide();
        } else {
            $("#lower_strike").hide();
            $("#high_strike_label").hide();
            $("#strike_label").show();
        }

        var prev_underlying = $("#pricingtable_underlying").val();

        // change underlying option list
        var ajax_url = page.url.url_for('resources/pricing_table');
        $.post(
            ajax_url,
            {
                action: "get_underlyings",
                ajax_only: 1,
                bet_type: bet_type,
                underlying: prev_underlying,
            },
            function(data) {
                $("#pricingtable_underlying_div").html(data);
                var underlying = $('#pricingtable_underlying');
                if (underlying.val() != prev_underlying) {
                    underlying.find("option").get(0).selected = true;
                    underlying.find("option").get(0).val();
                    underlying.trigger("change");
                }
            },
            "html"
        );
    });
};

var select_underlying_change = function() {
    $("#pricingtable_underlying").on("change", function() {
        var underlying = $(this).val();
        // change lower strike
        var ajax_url = page.url.url_for('resources/pricing_table');
        $.post(
            ajax_url,
            {
                action: "get_low_strike",
                ajax_only: 1,
                underlying: underlying
            },
            function(data) {
                $("#low_strike").attr("value", data);
            },
            "html"
        );
    });
};

var select_strike_type = function() {
    $("#strike_type").on('change', function() {
        var strike_type = $(this).val();
        if (strike_type == 'Moneyness terms') {
            $("#from_strike_percent").show();
            $("#from_strike_label").hide();
        } else {
            $("#from_strike_percent").hide();
            $("#from_strike_label").show();
        }
    }).change();
};


function initialize_pricing_table() {
    calculate_button_event();
    bet_type_select();
    select_underlying_change();
    select_strike_type();
}

onLoad.queue_for_url(initialize_pricing_table, 'pricing_table');
;onLoad.queue_for_url(function() {
    $('#profit-table-date').on('change', function() {
        $('#submit-date').removeClass('invisible');
    });
}, 'profit_table');
;onLoad.queue_for_url(function () {

    $('#EXCLUDEUNTIL').pickadate({
        minDate: moment().subtract(6, 'months').toDate(),
        maxDate: moment.add(5, 'years').toDate()
    });

    $('#selfExclusion').on('click', '#self_exclusion_submit', function () {
        return client_form.self_exclusion.validate_exclusion_date();
    });
}, 'self_exclusion');
;$(function() {

    function validate($parent) {
        $('.error').remove();
        $parent.find('input, select').each(function() {
            if ($(this).val() === '') {
                var $el = $(this);
                if ($el.parent().is('p')) {
                    $el = $el.parent();
                }
                if ($el.parent().is('.dob')) {
                    $el = $el.parent().parent();
                }
                $el.after('<div class="error">You can\'t leave this empty</div>');
            }
        });
        $('.error + .error').remove();
        return $('.error').length === 0;
    }

    $('form[novalidate]').on('submit', function(e) {
        var $form = $(this);
        $form.find('.error').remove();
        if (validate($form)) {
            $form.find('img').toggleClass('spinner');
        }
        e.preventDefault();
    });

    $('*[data-modal]').on('click', function() {

        var modal = $(this).attr('data-modal');

        $(modal).show();
        $('.overlay').removeClass('hidden');
        $(modal).trigger('modalShow');
    });

    $('.overlay').on('click', function(e) {

        if (!$(e.target).hasClass('overlay')) return;

        $('.overlay').addClass('hidden');
        setTimeout(function() {
            $('.overlay form').hide();
        }, 200);

        $(this).find('form').trigger('modalHide');
    });

    $('#real-account-form').on('modalShow', function() {
        currentStep = 0;
        gotoStep[currentStep]();
    });

    $('form').on('modalShow', function() {
        $(this).find('.error').hide();
        $(this).find('input').val('');
        $('.form-logo').removeClass('spinner');
    });

    var gotoStep = [
        function step1() {
            $('.step1').show();
            $('.step2').hide();
            $('.step3').hide();
        },
        function step2() {
            $('.step1').hide();
            $('.step2').show();
            $('.step3').hide();
        },
        function step3() {
            $('.step1').hide();
            $('.step2').hide();
            $('.step3').show();
        },
        function step4() {
            $('#real-account-form img').toggleClass('spinner');
            $('#open-real-acount').prop('disabled', true);
        }
    ];

    function gotoStep4() {
        $form.find('img').toggleClass('spinner');
    }

    $('#open-real-acount').on('click', function(e) {

        var valid = validate($('.step' + (currentStep + 1)));

        e.preventDefault();
        if (valid) {
            currentStep++;
            $('[class^=step]').hide();
            gotoStep[currentStep]();
        }
    });
});
;onLoad.queue_for_url(function() {
    $('#statement-date').on('change', function() {
        $('#submit-date').removeClass('invisible');
    });
}, 'statement');
;RealityCheck = (function ($) {
    "use strict";

    var reality_check_url = page.url.url_for('user/reality_check');

    function RealityCheck(cookieName, persistentStore, logoutLocation) {
        var val;
        
        this.cookieName = cookieName;
        this.storage = persistentStore;

        val = ($.cookie(this.cookieName)||'').split(',');
        val[0] = parseInt(val[0]);
        if (isNaN(val[0]) || val[0]<=0) return;  // no or invalid cookie

        if (val[1] && val[1] != persistentStore.get('reality_check.srvtime')) {
            persistentStore.set('reality_check.srvtime', val[1]);
            persistentStore.set('reality_check.basetime', (new Date()).getTime());
            persistentStore.set('reality_check.ack', 1);
        }

        this.logoutLocation = logoutLocation;
        if (!this.logoutLocation) return; // not logged in?

        this.interval = parseInt(val) * 60 * 1000; // convert minutes to millisec

        this.basetime = persistentStore.get('reality_check.basetime');

        return this.setAlarm();
    }

    RealityCheck.prototype.setAlarm = function () {
        var that = this;
        var alrm = this.interval - ((new Date()).getTime() - this.basetime) % this.interval;

        // console.log('interval = '+this.interval+', next alarm in '+alrm+' ms');
        // console.log('alrm at '+(new Date((new Date()).getTime()+alrm)).toUTCString());

        if (this.tmout) window.clearTimeout(this.tmout);

        this.tmout = window.setTimeout(function () {
            // console.log('fire at '+(new Date()).toUTCString());
            that.fire();
        }, alrm);
    };

    RealityCheck.prototype.fire = function () {
        var that = this;

        $.ajax({
            url: reality_check_url,
            dataType: 'text',
            success: function (data) {
                that.display(data);
            },
            error: function (xhr) {
                if (xhr.status === 404) return; // no MF loginid
                window.setTimeout(function () {
                    that.fire();
                }, 5000);
            },
        });
    };

    RealityCheck.prototype.display = function (data) {
        var that = this, outer, middle, storage_handler; 

        outer = $('#reality-check');
        if (outer) outer.remove();

        outer = $("<div id='reality-check' class='lightbox'></div>").appendTo('body');
        middle = $('<div />').appendTo(outer);
        $('<div>' + data + '</div>').appendTo(middle);

        storage_handler = function (jq_event) {
            var ack;

            if (jq_event.originalEvent.key !== 'reality_check.ack') return;
            ack = parseInt(jq_event.originalEvent.newValue || 1);
            if (ack > that.lastAck) {
                $(window).off('storage', storage_handler);
                that.setAlarm();
                $('#reality-check').remove();
            }
        };

        // in case the client works with multiple windows, check if he has acknowleged
        // it in another window.
        $(window).on('storage', storage_handler);

        this.lastAck = parseInt(this.storage.get('reality_check.ack') || 1);
        $('#reality-check [bcont=1]').on('click', function () {
            that.storage.set('reality_check.ack', that.lastAck+1);
            $(window).off('storage', storage_handler);
            that.setAlarm();
            $('#reality-check').remove();
        });

        $('#reality-check .blogout').on('click', function () {
            window.location.href = that.logoutLocation;
        });
    };

    return RealityCheck;
}(jQuery));

onLoad.queue(function () {
    var logoutBtn = $('#btn_logout')[0];
    if (!logoutBtn) return;
    if (window.reality_check_object) return;
    window.reality_check_object = new RealityCheck('reality_check', LocalStore, logoutBtn.getAttribute('href'));
});
;window._trackJs = {
    onError: function(payload, error) {

        function itemExistInList(item, list) {
            for (var i = 0; i < list.length; i++) {
                if (item.indexOf(list[i]) > -1) {
                    return true;
                }
            }
            return false;
        }

        var ignorableErrors = [
            // General script error, not actionable
            "[object Event]",
            // General script error, not actionable
            "Script error.",
            // error when user  interrupts script loading, nothing to fix
            "Error loading script",
            // an error caused by DealPly (http://www.dealply.com/) chrome extension
            "DealPly",
            // this error is reported when a post request returns error, i.e. html body
            // the details provided in this case are completely useless, thus discarded
            "Unexpected token <"
        ];

        if (itemExistInList(payload.message, ignorableErrors)) {
            return false;
        }

        payload.network = payload.network.filter(function(item) {

            // ignore random errors from Intercom
            if (item.statusCode === 403 && payload.message.indexOf("intercom") > -1) {
                return false;
            }

            return true;
        });

        return true;
    }
};

// if Track:js is already loaded, we need to initialize it
if (typeof trackJs !== 'undefined') trackJs.configure(window._trackJs);
;//////////////////////////////////////////////////////////////////
// Purpose: Write loading image to a container for ajax request
// Parameters:
// 1) container - a jQuery object
//////////////////////////////////////////////////////////////////
function showLoadingImage(container)
{
    var image_link = page.settings.get('image_link');

    container.html('<div class="progress"></div>');
}

/////////////////////////////////////////////////////////////////
// Purpose   : Generate form's parameters in the format that is
//             required by XMLHttpRequest.send
// Return    : Parameters string e.g. var1=val1&var2=var2
// Parameters: Targeted form object
/////////////////////////////////////////////////////////////////
function getFormParams(form_obj)
{
    var params_arr = [];
    if (! form_obj) return '';
    var elem = form_obj.elements;

    var j=0;
    for (var i = 0; i < elem.length; i++)
    {
        if(elem[i].name)
        {
            if(elem[i].nodeName == 'INPUT' && elem[i].type.match(/radio|checkbox/) && !elem[i].checked)
            {
                continue; // skip if it is not checked
            }

            params_arr[j] = elem[i].name+'='+encodeURIComponent(elem[i].value);
            j++;
        }
    }

    var params_str = params_arr.join('&');
    return params_str;
}

/**
 * Adds thousand separators for numbers.
 *
 * @param Number num: any number (int or float)
 * @param string separator [optional] string to use for the separator (default is , as the name suggests)
 * @return string
 */
function virgule(given_num)
{
    if (isNaN(given_num)) {
        return given_num;
    }
    var maybe_minus = '';
    var num = given_num;
    if (given_num < 0) {
        num = num * -1;
        maybe_minus = '-';
    }

    if (num < 1000) {
        return maybe_minus + num;
    }

    var separator = ',';
    if (arguments.length > 1) {
        separator = arguments[1];
    }

    var int_part = num;
    var float_part = '';
    var float_match = /(\d{3,})\.(\d+)/.exec(num);
    if (float_match) {
        int_part = float_match[1];
        float_part = '.' + float_match[2];
    }
    var match = /(\d+)(\d\d\d)$/.exec(int_part);

    return maybe_minus + virgule(match[1], separator) + separator + match[2] + float_part;
}

function getImageLink() {
    var image_link = page.settings.get('image_link');
    return '<img src="' + image_link['hourglass'] + '" class="bet_bottom_loading_image" />';
}

/**
 * updates a container node for when a price value inside is updated.
 * Like when the bet price is changed, updates the bet buy price container
 * with arrows to display the change.
 *
 * @param item Object: the node object
 * @param old_val: what it used to be
 * @param new_val: what it is now
 */
function price_moved (item, old_val, new_val) {
    if (new_val < old_val) {
       item.removeClass("price_moved_up");
       item.addClass("price_moved_down");
    } else if (new_val > old_val) {
       item.removeClass("price_moved_down");
       item.addClass("price_moved_up");
    } else {
       item.removeClass("price_moved_down");
       item.removeClass("price_moved_up");
    }
}


/**
 * Returns the highest z-index in the page.
 * Accepts a jquery style selector to only check those elements,
 * uses all container tags by default
 * If no element found, returns null.
 *
 * @param selector: a jquery style selector for target elements
 * @return int|null
 */
function get_highest_zindex(selector) {
    if (!selector) {
        selector = 'div,p,area,nav,section,header,canvas,aside,span';
    }
    var all = [];
    var _store_zindex = function () {
        if ($(this).is(':visible')) {
            var z = $(this).css("z-index");
            if ( !isNaN(z) ) {
                all.push(z);
            }
        }
    };
    $(selector).each(_store_zindex);

    return all.length ? Math.max.apply(Math, all) : null;
}

var user_country;
var get_user_country = function(callback) {
    if(user_country) {
            callback.call(user_country);
    } else {
        $.ajax({ crossDomain: true, url: page.url.url_for('country'), async: true, dataType: "json" }).done(function(response) {
            user_country = response;
            callback.call(response);
        });
    }
};

/**
 * Returns a stylized price for a value as units and cents.
 * this could be used anywhere we need to show a float value
 * like in bet_sell.js to display the current sell price.
*/
function stylized_price(val) {
    var units = '0';
    var cents = '00';
    if (val) {
        val = Math.round(val * 100) / 100;
        var val_str = val.toString();
        var parts = val_str.split('.');
        units = virgule(parts[0]);
        cents = parts[1] || '00';
        if (cents.length < 2) {
            cents += '0';
        }
    }
    return {
        units: units,
        cents: '.' + cents
   };
}

/**
 * Add login param which contains the login cookie.
 * Required as our most of our ajax requests are now Cross domain and it will no longer send the login cookie.
 * Replaces the old header X-AJAX-COOKIE as this way it works for both IE9 and other newer browsers.
 * Not adding the header also avoid extra options request saving a whole 700ms on pricing.
 */
var ajax_loggedin = function(params) {
    var login_cookie = $.cookie('login');
    if(login_cookie) {
        var extra_params = 'login=' + encodeURIComponent(login_cookie);
        var staff_cookie = $.cookie('staff');
        if(staff_cookie) {
            extra_params += '&staff=' + encodeURIComponent(staff_cookie);
        }

        if(params.data) {
            params.data += '&' + extra_params;
        } else {
            params.data = extra_params;
        }
    }

    //A magical limit to param length imposed by IE.
    if(params.data && params.data.length > 2000) {
        params.type = "POST";
    }

    return params;
};

/**
 * Gets a DOM or jQuery element and reads its data attributes
 * and return an object of data stored in element attributes.
 * This is used where we store some data as element attributes.
 * Excludes commont HTML attributes from the element.
 *
 * @param element: DOM|jQuery element
 * @return object
 */
function element_data_attrs(element) {
    if (element && element instanceof jQuery) {
        element = element.get().pop();
    }
    if (!element || !element.attributes) {
        console.log(element);
        throw new Error("Can not get data attributes from none element parameter");
    }
    var data = {};
    var attrs = element.attributes;
    if (attrs.length) {
        var attr_blacklist = ['id', 'class', 'name', 'style', 'href', 'src', 'title', 'onclick'];
        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            if (attr_blacklist.indexOf(attr.name.toLowerCase()) > -1) continue;
            data[attr.name] = attr.value;
        }
    }
    return data;
}

/**
 * Gets a DOM or jQuery element and reads its data attributes
 * and returns a URL encoded string (like a form data)
 * This is used where we store some data as element attributes.
 *
 * @param element: DOM or jQuery element
 * @return string
 */
function element_data_attrs_as_form_params(element) {
    var data =  element_data_attrs(element);
    var params = [];
    var key;
    for (key in data) if (data.hasOwnProperty(key)) {
        var val = data[key];
        if (val === undefined) continue;
        params.push( key + '=' + encodeURIComponent(val) );
    }
    return params.join('&');
}

/**
 * Converts a snake_cased string to a camelCased string.
 * The first character case not changed unless requested.
 *
 * @param snake: snake_cased string
 * @param lower_case_first_char: boolean to force the first char to be lower cased
 * @param chars: string of chars to be considered a separator (default is _ and -)
 */
function snake_case_to_camel_case(snake, lower_case_first_char, chars) {
    chars = chars || '_-';
    var _upper2ndchar = function (m) { return m[1].toUpperCase(); };
    var regex = new RegExp('[' + chars + ']([a-zA-Z])', 'g');
    var camel = snake.replace(regex, _upper2ndchar);
    camel.replace('_', '');
    if (lower_case_first_char) {
        camel = camel[0].toLowerCase() + camel.substr(1);
    }
    return camel;
}

/**
 * attaches an inpage popup to the specified element.
 *
 * @param element any jquery selector or DOM/jQuery object to attach the inpage popups to
 */
function attach_inpage_popup(element) {
    var targets = $(element);
    var popups = [];
    var regx = /^popup-(.+)/;
    targets.each(function () {
        var attr,
            matched,
            attrs = element_data_attrs(this),
            conf = {};
        for (attr in attrs) if (attrs.hasOwnProperty(attr)) {
            matched = attr.match(regx);
            if (matched) {
                conf[matched[1]] = attrs[attr];
            }
        }
        var popup = new InPagePopup(conf);
        popup.attach(this);
        popups.push(popup);
    });
    return popups;
}

/**
 * Calculate container width for chart as of now but can
 * be used to get current container width
 */

function get_container_width() {
    return $('.chart_holder').length > 0 ? $('.chart_holder') : $('#content').width();
}

/**
 * in a jquery UI tabs object, finds out whitch tab is marked to be the
 * active tab by default.
 *
 * The default active tab is selected based on CSS classes of tab list items.
 *
 * @param element any jquery selector or DOM/jquery object that contains a jquery UI tab UL
 * @return int the index of active list item or 0 if none of the items were
 * marked as active.
 */
function find_active_jqtab(el) {
    var jqel = $(el);
    var ul = jqel.children('ul');
    if (!ul) throw new Error("Invalid parameter. element is not a jquery UI tab container");
    ul = ul.filter(":first");
    var items = ul.children('li');
    for (var i = 0; i < items.length; i++) {
        if ($(items[i]).hasClass('active')) {
            return i;
        }
    }
    return 0;
}


function initTabs() {

    function updateTabs($tabs) {

        $tabs.each(function() {
            var $tab = $(this);
                href = $tab.find('a').attr('href');
            try {
                $(href).toggle($tab.hasClass('active'));
            }
            catch(err) {}
        });
    }

    var tabSelector = '*[role=tabs] li,*[role=segmented] li',
        $tabs = $(tabSelector);

    if (!$tabs.hasClass('active')) $tabs.first().addClass('active');

    updateTabs($tabs);

    $('body').on('click', tabSelector, function(e) {
        var elm = $(this);
        var $tabs = elm.parent().find('li');
        $tabs.removeClass('active');
        elm.addClass('active');
        updateTabs($tabs);
        if(!elm.find('a:first').data('doredirect')) {
            e.preventDefault();
        }
    });
}

function initDateTimePicker() {
    $('input[type=date]').pickadate({
        monthsFull: [
            text.localize('January'),
            text.localize('February'),
            text.localize('March'),
            text.localize('April'),
            text.localize('May'),
            text.localize('June'),
            text.localize('July'),
            text.localize('August'),
            text.localize('September'),
            text.localize('October'),
            text.localize('November'),
            text.localize('December')
        ],
        monthsShort: [
            text.localize('Jan'),
            text.localize('Feb'),
            text.localize('Mar'),
            text.localize('Apr'),
            text.localize('May'),
            text.localize('Jun'),
            text.localize('Jul'),
            text.localize('Aug'),
            text.localize('Sep'),
            text.localize('Oct'),
            text.localize('Nov'),
            text.localize('Dec')
        ],
        weekdaysFull: [
            text.localize('Sunday'),
            text.localize('Moonday'),
            text.localize('Tuesday'),
            text.localize('Wednesday'),
            text.localize('Thursday'),
            text.localize('Friday'),
            text.localize('Saturday')
        ],
        weekdaysShort: [
            text.localize('Su'),
            text.localize('Mo'),
            text.localize('Tu'),
            text.localize('We'),
            text.localize('Th'),
            text.localize('Fr'),
            text.localize('Sa')
        ],
        today: text.localize('Today'),
        clear: text.localize('Clear'),
        firstDay: 1,
        //format: moment().localeData().longDateFormat('L'), // ?? 'yy-mm-dd'
        formatSubmit: 'yyyy/mm/dd'
    });

    $('input[type=time]').pickatime({
        clear: text.localize('Clear'),
    }); // .has-time-picker
}
