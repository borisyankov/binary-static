//////////////////////////////////////////////////////////////////
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

    $('body').on('mousedown', tabSelector, function(e) {
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
