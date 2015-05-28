
function WSTrade() {

    var g = GlobalWSTrade;

    function buttonmaker() {
        var $this = $(this);
        var icon = $this.attr('icon');
        var rcon = $this.attr('rcon');
        var mute = $this.attr('mute');
        var size = $this.attr('size');
        var opts = {icons:{}};
        if (0) {
            // buttons w/ icons are hopelessly broken in binary.com stylesheet..
            if (icon) opts.icons.primary = icon;
            if (rcon) opts.icons.secondary = rcon;
        }
        if (mute) opts.text = false;
        $this.button(opts);
        if (size && size=='baby') $this.css({'font-size':'0.75em'});
        if (size && size=='huge') $this.css({'font-size':'1.75em'});
    }

    function ws_setup() {

        //prepare a 'timespinner' widget extension to 'spinner' as per http://jqueryui.com/spinner/#time
        $.widget( "ui.timespinner", $.ui.spinner, {
            options: { /*secs*/step: 60 * 1000, /*hours*/page: 60 },
            _parse: function( value ) {
                if ( typeof value !== "string" ) return value;
                if ( Number( value ) == value ) return Number( value );
                return +Globalize.parseDate( value );
            },
            _format: function(value) {return Globalize.format(new Date(value), "t")}
        });

        g.currency_cultures = {USD:'en-US',GBP:'en-GB',AUD:'en-AU', EUR:'de-DE',YEN:'ja-JP'};
        g.nicetypes = {};
        g.live_contracts = {};
        g.limits_for = {};
        g.fmb_ids = {};
        g.$live_symbols = {};
        g.$contracts = $('#contracts');
        g.init_trade = {symbol:'R_100',ct_bc:'CALL-euro_atm',duration:900,duration_unit:'Seconds',basis:'Payout',currency:'USD',amount_val:10,date_start:0};
        g.contracts_built = 0;
        g.timezone_offset = (new Date()).getTimezoneOffset()*60;
        g.Contract = function(data) {
            console.log("new contract data %o", data);
            var symobj = g.all_symbols[data.symbol];
            if (!symobj) {
                console.log("will not build, no symbol " + data.symbol);
                return
            }
            var ct_bc = data.contract_type;
            if (data.barrier_category) ct_bc += '-' + data.barrier_category;
            var brief = symobj.display_name + '<br/>' + (g.nicetypes[ct_bc]||data.contract_type);
            this.bSell = !!data.fmb_id;
            var buysell = this.bSell? 'SELL': 'BUY';
            var div = '<div id="' + data.id + '" class="contract ui-state-default">'
                         + '<div class="contract_header ui-helper-clearfix">'
                             + '<button class="forget right" size="baby" mute="1" icon="ui-icon-circle-close">Close</button>'
                             + '<button class="dtldlg right" size="baby" mute="1" icon="ui-icon-help">Details</button>'
                             + '<div class="proposal">Offer</div>'
                             + '<span class="error"></span>'
                             + '<button class="purchase" size="huge" icon="ui-icon-cart">' + buysell + '</button>'
                         + '</div>'
                         + '<div><span class="bigtext">' + brief + '</span></div>'
                         + '<div><div class="ttype elbow">Not Offered</div><span class="price bigtext"></span></div>'
                         + '<div><div class="basis elbow">Payout</div><span class="payout bigtext"></span></div>'
                         + '<div><div class="symbol elbow"></div><span class="spot bigtext"></span></div>'
                         + '<div class="longcode"></div>'
                         + '<div class="contract_dlg" title="Contract Details"></div>'
                      + '</div>'
            $('#contracts').append(div);
            this.d0 = data;
            this.$div = $('#'+data.id, g.$contracts);
            this.$dlg = $('div.contract_dlg', this.$div).dialog({autoOpen:false});
            $('button', this.$div).each(buttonmaker);
            $('button.forget', this.$div).click(forget);
            $('button.dtldlg', this.$div).click(dtldlg);
            $('button.purchase', this.$div).click(purchase);
            if (this.bSell) {
                this.$div.removeClass('ui-state-active').addClass('ui-state-highlight');
                $('.proposal', this.$div).html('Contract ' + data.fmb_id);
            }
        };
        g.Contract.prototype.update = function(data) {
            //console.log("update with %o", data);
            var cul;
            for (var fld in data) {
                var $div = $('.'+fld, this.$div);
                $div.html(data[fld]);
                this.d0[fld] = data[fld];
            }
            if (data.payout) {
                cul = g.currency_cultures[this.d0.currency];
                var pay = Globalize.format(parseFloat(data.payout   ), 'C', cul);
                $('.payout', this.$div).html(pay);
            }
            var ttype, price;
            if (data.sell) {
                ttype = 'Sold for';
                price = data.sold_for;
            } else if (this.bSell) {
                ttype = 'Sell for';
                price = data.bid_price;
            } else {
                ttype = 'Buy for';
                price = data.ask_price;
            }
            if (!price && data.buy_price) {
                ttype = 'Bought for';
                price = data.buy_price;
            }
            if (price) {
                cul = g.currency_cultures[this.d0.currency];
                var val = Globalize.format(parseFloat(price), 'C', cul);
                $('.price', this.$div).html(val);
                $('.ttype', this.$div).html(ttype);
            }
            if (data.fmb_id && data.trx_id) {
                this.bSell = true;
                $('button.purchase', this.$div).button('option', 'label', data.fmb_id);
                this.$div.removeClass('ui-state-active').addClass('ui-state-highlight');
                $('.proposal', this.$div).html('Contract ' + data.fmb_id);
            }
            var details = '';
            if (this.bSell) {
                if (data.fmb_id) {
                    details += 'Contract Number '+ data.fmb_id + '<br/>';
                    if (data.trx_id)        details += 'Transaction Number '+ data.trx_id + '<br/>';
                    if (data.buy_price)     details += 'Bought for '+ data.buy_price + '<br/>';
                    if (data.expiry_time)   details += 'Expires '   + niceDate(data.expiry_time) + '<br/>';
                    if (data.purchase_time) details += 'Purchased ' + niceDate(data.purchase_time) + '<br/>';
                    if (data.start_time)    details += 'Contract Starts ' + niceDate(data.start_time) + '<br/>';
                    if (data.balance_after) details += 'Balance After ' + data.balance_after + '<br/>';
                }
            } else {
                details += 'Not yet purchased<br/>';
                if (data.date_start)    details += 'Proposed Start Time '+ niceDate(data.date_start) + '<br/>';
            }

            if (details) this.$dlg.html(details);
            if (data.error) {
                this.$div.removeClass('ui-state-active').addClass('ui-state-error');
                $('button.purchase', this.$div).hide();
                $('span.error', this.$div).show();
                var detail = data.detail || 
                            ( (data.basis? (data.basis||' '): ''                          )
                            + (data.amount_str? (data.amount_str + ' '): ''               )
                            + (data.duration && data.duration_unit? ('over '+data.duration+data.duration_unit+' '): '')
                            + (data.data_start? ('starting '+niceDate(data.date_start)+' '): '' ) );
                $('.longcode', this.$div).html(detail);
            }
        };
        g.Contract.prototype.destroy = function() {
            this.$div && this.$div.remove();
        };
    }

    // http://freeda.dbnet.com.au/pub/globalize/0.1.1/examples/browser/
    function niceDayUTC(epochStr) {
        var epoch = parseInt(epochStr) + g.timezone_offset;
        return Globalize.format(new Date(epoch*1000), "dd-MMM-yyyy", 'en-GB');
    }
    function niceTimeUTC(epochStr) {
        var epoch = parseInt(epochStr) + g.timezone_offset;
        return Globalize.format(new Date(epoch*1000), "HH:mm:ss", 'en-GB');
    }
    function niceDate(epochStr) {
        var d = new Date(parseInt(epochStr)*1000);
        return Globalize.format(d, "dd-MMM-yyyy HH:mm:ss", 'en-GB');
    }
    function build_symbols(offerings) {
        var buttonsets = '';
        $.each(offerings.offerings, function(i, mkt) {
            $.each(mkt.available, function(i, sbm) {
                var emptyset = true;
                $.each(sbm.available, function(i, sym) {
                    var symbol = sym.symbol_display;
                    var symobj = g.all_symbols[symbol];
                    if (!symobj) return;
                    if (emptyset) buttonsets += '<h3>' + mkt.market + ' &mdash; ' + sbm.submarket + '</h3>' + '<div class="buttonset">';
                    emptyset = false;
                    var s = symobj.symbol;
                    g.all_symbols[s] = symobj; // this map is now keyed by both short- and display-name
                    buttonsets += '<input type="radio" name="symbol" value="' + s + '" id="' + s + '"/>'
                               + '<label for="' + s + '">' + symbol + '</label>';
                })
                if (!emptyset) buttonsets += '</div>';
            })
        });
        //console.log("buttonset now %o", buttonset);
        $('#symbolbuts').html(buttonsets).accordion({collapsible:true, heightStyle:'content'});
        $('#symbolbuts .buttonset').buttonset();
        $('#symbolbuts label').tooltip({items:"label", open: opensym, close: closesym, content: showsym});
        $('#symbolbuts input[name=symbol]').change(change_symbol);
        // initial trading values..
        $('#symbolbuts input#' + g.init_trade.symbol).prop('checked',true).button('refresh').change();
        $('#contractbuts input#' + g.init_trade.ct_bc).prop('checked',true).button('refresh').change();
        $('#durationflds input#duration').val(g.init_trade.duration);
        $('#durationflds input#' + g.init_trade.duration_unit).prop('checked',true).button('refresh').change();
        $('#payoutflds input#' + g.init_trade.basis).prop('checked',true).button('refresh');
        $('#payoutflds input#' + g.init_trade.currency).prop('checked',true).button('refresh');
        $('#payoutflds #amount_str').spinner('value', g.init_trade.amount_val); change_payout(0);
        // first proposal..
        $('#pricing_form').trigger("submit");
    }
    function closesym(ev, ui) {
        var symbol = ui.tooltip.data('symbol');
        delete g.$live_symbols[symbol];
        var symbol_id = ui.tooltip.data('symbol_id');
        if (symbol_id) {
            delete g.$live_symbols[symbol_id];
            g.ws.send(JSON.stringify({forget:symbol_id}));
        }
    }
    function opensym(ev, ui) {
        var symbol = $('h2.livesym', ui.tooltip).attr('symbol');
        ui.tooltip.data('symbol', symbol);
        g.$live_symbols[symbol] = ui.tooltip;
        g.ws.send(JSON.stringify({ticks:symbol}));
    }
    function spot_report(s) {
        var d = new Date(s.spot_time*1000);
        var str = '<h2 class="livesym" symbol="' + s.symbol + '">'
                + s.display_name + ": " + s.quoted_currency_symbol + " " + s.spot + "</h2>"
                + "<div>" + s.exchange_name + " &mdash; " + s.symbol + "</div>"
                + "<div> as at " + d.toUTCString() + "</div>";
        if (s.error) str += '<div class="ui-state-error">' + s.error + '</div>';
        return str
    }
    function showsym() {
        var $this = $(this);
        var symbol = $this.text();
        return spot_report(g.all_symbols[symbol]);
    }
    function onmessage(m) {
        var data = JSON.parse(m.data);
        var contract, symbol;
        //console.log('got message %o', data);
        if (data.ticks) {
            symbol = data.ticks;
            var $live_symbol = g.$live_symbols[symbol];
            if (!$live_symbol) {
                if (data.id) g.ws.send(JSON.stringify({forget:data.id}));
                return;
            }
            if (data.id && !g.$live_symbols[data.id]) g.$live_symbols[data.id] = $live_symbol; 
            var s = g.all_symbols[symbol];
            if (data.error) {
                s.error = data.error
            } else {
                delete s.error;
                s.spot = data.quote;
                s.spot_time = data.epoch;
            }
            $live_symbol.html(spot_report(s));
            return;
        }
        if (data.active_symbols) {
            g.all_symbols = data.active_symbols;
            g.ws.send(JSON.stringify({offerings:{}}));
            return;
        }
        if (data.offerings) {
            console.log("offerings data is %o", data.offerings);
            build_symbols(data.offerings);
            return;
        }
        if (data.buy) {
            console.log("buy result data is %o", data);
            contract = g.live_contracts[data.buy];
            if (!contract) {
                console.log("dropping buy result for " + data.buy);
                g.ws.send(JSON.stringify({forget:data.buy}));
                return;
            }
            g.fmb_ids[data.fmb_id] = contract;
            contract.update(data);
            return
        }
        if (data.sell) {
            console.log("sell result data is %o", data);
            contract = g.live_contracts[data.sell];
            if (!contract) {
                console.log("dropping sell result for " + data.sell);
                g.ws.send(JSON.stringify({forget:data.sell}));
                return;
            }
            contract.update(data);
            return
        }
        if (data.portfolio_stats) {
            g.portfolio_stats = data.portfolio_stats;
            console.log("portfolio stats: %o", g.portfolio_stats);
            if (g.portfolio_stats.batch_count==0) $('#portfol_form button').button('enable');
            return;
        }
        if (data.contracts_for) {
            symbol = data.contracts_for.symbol;
            delete data.contracts_for.symbol;
            console.log("limits_for " + symbol + ": %o", data.contracts_for);
            g.limits_for[symbol] = data.contracts_for;
            apply_limits();
            return;
        }
        // any other input message should be about a contract.
        var contract_id = data.id;
        contract = g.live_contracts[contract_id];
        if (!contract) {
            if (data.fmb_id) {
                if (data.batch_index == data.batch_count) {
                    $('#portfol_form button').button('enable');
                }
                if (g.fmb_ids[data.fmb_id]) {
                    console.log("already showing fmb_id " + data.fmb_id +"; forget " + data.id);
                    g.ws.send(JSON.stringify({forget:data.id}));
                    return
                }
            }
            contract = new g.Contract(data);
            if (!contract.d0) { // means not built successfully
                console.log("did not build; forget " + contract_id);
                g.ws.send(JSON.stringify({forget:contract_id}));
                contract.destroy();
                return
            }
            g.live_contracts[contract_id] = contract;
            g.contracts_built++;
            if (data.fmb_id) g.fmb_ids[data.fmb_id] = contract;
        }
        contract.update(data);
    }
    function apply_limits() {
        var sym = $('#symbolbuts input[name=symbol]:checked').attr('id');
        if (!sym) return;
        var limits = g.limits_for[sym];
        if (!limits) return;
        console.log("apply limits for " + sym + " using %o", limits);
        $('#contractbuts input[name=ct_bc]').button('disable').removeData('limits');
        $.each(limits.available, function(i,limit){
            var ct_bc = limit.contract_type + '-' + limit.barrier_category;
            var $but = $('#contractbuts input#'+ct_bc);
            $but.button('enable');
            var limits = $but.data('limits') || [];
            limits.push(limit);
            $but.data('limits',limits);
        });
        if ($('#contractbuts input[name=ct_bc]:checked:disabled').length) {
            $('#contractbuts input[name=ct_bc]:enabled').first().prop('checked',true).button('refresh');
        }
        var $but = $('#contractbuts input[name=ct_bc]:checked');
        console.log("with data %o", $but.data('limits'));
        $but.change();
    }
    function forget() {
        var contract_id = $(this).parents('.contract').attr('id');
        //console.log("I want to forget " + contract_id);
        g.ws.send(JSON.stringify({forget:contract_id}));
        var contract = g.live_contracts[contract_id];
        if (contract.d0.fmb_id) delete g.fmb_ids[contract.d0.fmb_id];
        delete g.live_contracts[contract_id];
        contract.destroy();
    }
    function dtldlg() {
        var contract_id = $(this).parents('.contract').attr('id');
        var contract = g.live_contracts[contract_id];
        console.log("detail for %o!", contract);
        contract.$dlg.dialog('open');
    }
    function purchase() {
        var contract_id = $(this).parents('.contract').attr('id');
        var contract = g.live_contracts[contract_id];
        var price;
        $(this).button('disable').button('option', 'label', 'Wait..');
        if (contract.bSell) {
            price = contract.d0.bid_price;
            console.log("selling " + contract_id + " from %o " + " for " + price, contract);
            g.ws.send(JSON.stringify({sell:contract_id, price:price}));
            return;
        }
        price = contract.d0.ask_price;
        console.log("buying " + contract_id + " from %o " + " for " + price, contract);
        g.ws.send(JSON.stringify({buy:contract_id, price:price}));
    }
    function pricing_submit(e) {
        var data = {};
        var arr = $('input, select', $('.innerzone')).serializeArray();
        $.each(arr,function(idx,val){data[val.name]=val.value});
        console.log("submitting data %o", data);
        g.ws.send(JSON.stringify(data));
        if (e) e.preventDefault();
    }
    function portfol_submit(e) {
        $('#portfol_form button').button('disable');
        g.ws.send(JSON.stringify({portfolio:1}));
        $('.innerzone.ui-dialog-content').dialog('close');
        if (e) e.preventDefault();
    }
    function change_payout(e) {
        var cur = $('input[name=currency]:checked').val();
        var cul = g.currency_cultures[cur];
        Globalize.culture(cul); // this is to also set the start_at timespinner format
        $('#amount_str').spinner('option', 'culture', cul);
        var val = $('#amount_str').spinner('value');
        $('#amount_val').val(val);
        var basis = $('input[name=basis]:checked').val();
        if (basis) $('#payout_name').html("For a " + basis + " of " + $('#amount_str').val());
    }
    function change_symbol(e) {
        var symbol = this.id;
        var symobj = g.all_symbols[symbol];
        $('#display_name').html("Trading " + symobj.display_name);
        if (g.limits_for[symbol]) {
            apply_limits();
            return
        }
        g.ws.send(JSON.stringify({contracts_for:symbol}));
    }
    function change_contract(e) {
        var $ct_bc = $('input[name=ct_bc]:checked');
        var ct_bc = $ct_bc.val();
        $('#contract_name').html(g.nicetypes[ct_bc] || ct_bc);
        var match = /(.*)-(.*)/.exec(ct_bc);
        var ct = match[1];
        var bc = match[2];
        $('#contract_type').val(ct);
        $('#barrier_category').val(bc);
        $('#barriers .cts'           ).hide().find('input').prop('disabled', true);
        $('#barriers .cts.'+ct+'.'+bc).show().find('input').prop('disabled', false);
        var limits = $ct_bc.data('limits');
        if (!limits) return;
        console.log("chosen ct " + ct + " bc " + bc + ' with limits %o', limits);
        // disable all start options and enable relevant ones..
        $('#startflds input[name=start_when]').button('disable');
        var fs_memo = '';
        var du_memo = '';
        var cb_memo = '';
        $.each(limits, function(i, lim) {
            //console.log("report limit " + i + " %o", lim);
            if (lim.start_type == 'spot')    $('#startflds input#start_immed').button('enable');
            if (lim.start_type == 'forward') {
                $('#startflds input#start_in').button('enable');
                $('#startflds input#start_at').button('enable');
                if (lim.forward_starting_options) {
                    $.each(lim.forward_starting_options, function(i, fso) {
                        fs_memo += '<div>on ' + niceDayUTC(fso.date)
                                + ' between ' + niceTimeUTC(fso.open)
                                + ' and ' + niceTimeUTC(fso.close) + '</div>';
                    });
                }
            }
            $('#startflds input[name=start_when]:enabled').first().prop('checked',true).button('refresh');
            change_startwhen();
            var du_label = '';
            if (lim.expiry_type == 'intraday') du_label = 'Today';
            if (lim.expiry_type == 'daily'   ) du_label = 'Whole days';
            if (lim.expiry_type == 'tick'    ) du_label = 'Ticks';
            if (lim.start_type == 'forward'  ) du_label += '(delayed start)';
            du_memo += '<div>' + du_label + ' between ' + lim.min_contract_duration + ' and ' + lim.max_contract_duration + '</div>';
            if (lim.barriers == 1 && lim.barrier_category != 'non_financial')
                cb_memo += '<div>' + lim.expiry_type + ' durations: ' + lim.barrier + '</div>';
            if (lim.barriers == 2 && lim.barrier_category != 'non_financial')
                cb_memo += '<div>' + lim.expiry_type + ' durations: Between ' + lim.low_barrier + ' and ' + lim.high_barrier + '</div>';
        });
        if (fs_memo) fs_memo = '<p>Start times available (UTC) for this contract..' + fs_memo + '</p>';
        if (du_memo) du_memo = '<p>Durations available for this contract..'         + du_memo + '</p>';
        if (cb_memo) cb_memo = '<p>Valid targets for this contract..'               + cb_memo + '</p>';
        $('#startflds    div.memo').html(fs_memo);
        $('#durationflds div.memo').html(du_memo);
        $('#contractbuts div.memo').html(cb_memo);

    }
    function change_duration_date(datestr,dp) {
        var today = new Date();
        var thatDate = $(this).datepicker('getDate');
        var days = Math.round((thatDate - today)/(1000*60*60*24));
        $("input#Days").prop("checked",true).button('refresh');
        $('#duration').spinner("value", days+1);
        change_duration(0);
    }
    function change_duration(e) {
        var duration_str = $('input[name=duration]').val() + ' ' + $('input[name=duration_unit]:checked').attr('id');
        $('#duration_str').html("Expiry in " + duration_str);
    }
    function load_nicetypes(i,v) {
        var ct_bc = $(v).attr('for');
        var ct    = $(v).attr('ct');
        // map both ct on its own and the ct_bc pair; this allows lookup when we only have ct available.
        g.nicetypes[ct] = $(v).text();
        g.nicetypes[ct_bc] = $(v).text();
    }
    function change_slider1(e,rs) {
        $('#barrier').val(rs.value);
    }
    function change_slider2(e,rs) {
        $('#barrier').val(rs.values[0]);
        $('#barrier2').val(rs.values[1]);
    }
    function change_startwhen(e) {
        var start_when = $('input[name=start_when]:checked').val();
        $('#date_start_in').prop('disabled',true);
        $('input[name=date_start_unit]').button('disable');
        $('#date_start_at').timespinner('disable');
        $('.date_start_in_ctr, .date_start_at_ctr').hide();
        if (start_when == 'start_immed') {
            $('#date_start').prop('disabled',true);
            $('#start_str').html("Starting immediately");
            return;
        }
        $('#date_start').prop('disabled',false);
        if (start_when == 'start_in') {
            $('#date_start_in').prop('disabled',false);
            $('input[name=date_start_unit]').button('enable');
            $('.date_start_in_ctr').show();
            change_start_in(0);
            return;
        }
        if (start_when =='start_at') {
            $('#date_start_at').timespinner('enable');
            $('.date_start_at_ctr').show();
            change_start_at(0);
            return;
        }
    }
    function change_start_str() {
        var datestart = new Date($('#date_start').val() * 1000);
        var mid_night = new Date(); mid_night.setHours(24,0,0,0); // this is midnight tonight
        var days = ((datestart - mid_night)/(1000*60*60*24));
        var time_part = Globalize.format(datestart, "t");
        var when;
             if (days<0) when = "at " + time_part;
        else if (days<1) when = "tomorrow at " + time_part;
        else             when = (datestart.toDateString() + ' ' + datestart.toTimeString());
        $('#start_str').html('Start ' + when);
    }
    function change_start_in(e) {
        var date_start_unit = $('input[name=date_start_unit]:checked').val();
        var units = {d:24*60*60, h:60*60, m:60, s:1}[date_start_unit];
        var seconds = $('#date_start_in').val() * units;
        var date_start = Math.ceil(new Date().getTime()/1000 + seconds);
        $('#date_start').val(date_start);
        change_start_str();
    }
    function change_start_at(e) {
        var d = new Date($('#date_start_at').timespinner('value'));
        var proposed = new Date();
        proposed.setHours(d.getHours(), d.getMinutes(), 0, 0);
        var now = new Date();
        if (proposed < now) proposed.setDate(proposed.getDate()+1);
        $('#date_start').val( proposed.getTime()/1000 );
        change_start_str();
    }

    function onclose(ev) {
        if (g.degrade) g.degrade *= 1.2
        else g.degrade = 1;
        console.log("websocket closed with event %o.  Re-opening in " + g.degrade + ' secs', ev);
        if (ev.code==1006) {
            // this is the usual failure code, even for auth failure; message to be generic:
            // see http://dev.w3.org/html5/websockets/
            // and http://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description
            //alert('Connection with Server not currently available');
        } else {
            //alert('Connection with Server closed with code' + ' ' + ev.code + (ev.reason?('('+ev.reason+')'):''));
        }
        $('button.purchase').button('disable');
        window.setTimeout(opensocket, g.degrade*1000, {onclose:onclose,onmessage:onmessage,onopen:onreopen});
    }

    function get_initial() {
        console.log("socket open; getting initial data..");
        g.ws.send(JSON.stringify({active_symbols:'display_name'}));
    }

    function onreopen() {
        console.log("socket re-opened");
        delete g.degrade;
        if (g.contracts_built > 0) return;
        console.log("re-trying opening sequence");
        get_initial();
    }

    function opensocket(opts) {
        g.ws  = new WebSocket(g.websockets_svr);
        for (var opt in opts) {
            g.ws[opt] = opts[opt];
        }
    }

    function ws_stop() {
        console.log("Stopping WSTrade.  Closing websocket..");
        g.ws.onopen = g.ws.onmessage = g.ws.onclose = function(){};
        g.ws.close();
    }

    function position(of) {
        return {width: '640px', position:{my:'left top', at: 'left bottom', of:of} /*, modal:true*/}
    }

    function ws_init() { 

        // setup handlers and widgets..
        $('.button').each(buttonmaker);
        $('#select_symbol')  .click(function(){$('#symbolbuts')  .toggle('medium')}); //dialog(position('#select_symbol')));
        $('#select_contract').click(function(){$('#contractbuts').toggle('medium')});
        $('#select_duration').click(function(){$('#durationflds').toggle('medium')});
        $('#select_start')   .click(function(){$('#startflds')   .toggle('medium')});
        $('#select_payout')  .click(function(){$('#payoutflds')  .toggle('medium')});
        $('.buttonset').buttonset();
        $('#amount_str').spinner({min:0,numberFormat:"C",change:change_payout});
        $("input[name=currency]").change(change_payout);
        $("input[name=basis]").change(change_payout);
        $("input[name=duration_unit]").change(change_duration);
        $("input[name=ct_bc]").change(change_contract);
        $('#duration').spinner({min:0,change:change_duration});
        $('#duration_date').datepicker({onSelect:change_duration_date});
        $("input#Seconds").prop("checked",true).button('refresh');

        // date_start_in
        $('#date_start_in').spinner({min:0,change:change_start_in});
        $("input#date_start_unit_Seconds").prop("checked",true).button('refresh');
        $("input[name=date_start_unit]").change(change_start_in);

        // date_start_at
        {
            var start_time = new Date();
            start_time.setMinutes(start_time.getMinutes()+10);
            $('#date_start_at').timespinner({change:change_start_at}).timespinner('value', start_time);
        }

        // date_start_when
        $("input[name=start_when]").change(change_startwhen);

        // init to start immed
        $('#startflds  input#start_immed').prop('checked',true).button('refresh').change();

        // contract names
        $('#contractbuts label').each(load_nicetypes);

        //barriers
        $('#slider2').slider({range:true, min:-10, max:+10, values:[-4,4], slide:change_slider2});
        $('#slider1').slider({min:-10, max:+10, value:0, slide:change_slider1});

        // form submit
        $('#pricing_form').submit(pricing_submit);
        $('#portfol_form').submit(portfol_submit);

        // create a single socket..
        opensocket({onclose:onclose,onmessage:onmessage,onopen:get_initial});
    }

    onUnload.queue(ws_stop);
    ws_setup();
    ws_init();
}

if ('GlobalWSTrade' in window) {
    onLoad.queue(WSTrade)
}

