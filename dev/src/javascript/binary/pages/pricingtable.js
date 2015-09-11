var calculate_button_event = function() {
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
