var client_form;
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
