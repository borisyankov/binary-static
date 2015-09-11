/*
 * Symbols object parses the active_symbols json that we get from socket.send({active_symbols: 'brief'}
 * and outputs in usable form, it gives markets, underlyings
 *
 *
 * Usage:
 *
 * use `Symbols.details` to populate this object first
 *
 * then use
 *
 * `Symbols.markets` to get markets like Forex, Random etc
 * `Symbols.underlyings` to get underlyings
 *
 */

var Symbols = (function () {
    'use strict';

    var tradeMarkets = {}, tradeUnderlyings = {}, current = '';

    var details = function (data) {
        var allSymbols = data['active_symbols'];

        allSymbols.forEach(function (element) {
            var currentMarket = element['market'],
                currentUnderlying = element['symbol'];

            if (!tradeMarkets.hasOwnProperty(currentMarket)) {
                tradeMarkets[currentMarket] = element['market_display_name'];
            }

            if (!tradeUnderlyings.hasOwnProperty(currentMarket)) {
                tradeUnderlyings[currentMarket] = {};
            }

            if (!tradeUnderlyings[currentMarket].hasOwnProperty(currentUnderlying)) {
                tradeUnderlyings[currentMarket][currentUnderlying] = {
                    is_active: (!element['is_trading_suspended'] && element['exchange_is_open']),
                    display: element['display_name']
                };
            }
        });
    };

    var getSymbols = function () {
        TradeSocket.send({
            active_symbols: "brief"
        });
    };

    var currentSymbol = function(symbol){
        if(typeof symbol !== 'undefined'){
            current = symbol;
        }
        return current;
    };

    return {
        details: details,
        getSymbols: getSymbols,
        markets: function () { return tradeMarkets; },
        underlyings: function () { return tradeUnderlyings; },
        currentSymbol: currentSymbol
    };

})();
