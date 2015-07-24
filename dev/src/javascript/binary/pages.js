// json to hold all the events loaded on trading page
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
