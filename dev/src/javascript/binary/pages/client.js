var client_form;
onLoad.queue(function() {
        client_form = new ClientForm({restricted_countries: page.settings.get('restricted_countries'), valid_loginids: page.settings.get('valid_loginids')});
});

var select_user_country = function() {
    if ($('#residence').length > 0) {
        var restricted_countries = new RegExp(page.settings.get('restricted_countries'));
        var selected_country = $('#residence').val();

        if (selected_country.length > 0) {
            selected_country = (restricted_countries.test(selected_country)) ? '' : selected_country;
            $('#residence').val(selected_country).change();
        } else {
            $.ajax({
                crossDomain: true,
                url: page.url.url_for('country'),
                async: true,
                dataType: "json"
            }).done(function(response) {
                selected_country = (restricted_countries.test(response.country)) ? '' : response.country;
                $('#residence').val(selected_country).change();
            });
        }
    }
};

var disable_residence = function () {
    var virtual_residence = $('#virtual_residence');
    if (virtual_residence.length > 0 && virtual_residence.val() == $('#residence').val()) {
        $('#residence').attr('disabled', true);
    }
};

var enable_residence_form_submit = function () {
    $('form#openAccForm').submit(function (event) {
        $('#residence').removeAttr('disabled');
    });
};

pjax_config_page('new_real', function() {
    return {
        onLoad: function() {
            client_form.on_residence_change();
            select_user_country();
            disable_residence();
            enable_residence_form_submit();
            if (page.client.is_logged_in) {
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

var financial_enable_fields_form_submit = function () {
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
            financial_enable_fields_form_submit();
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
