var client_form;
onLoad.queue(function() {
        client_form = new ClientForm({restricted_countries: page.settings.get('restricted_countries'), valid_loginids: page.settings.get('valid_loginids')});
});

pjax_config_page('user/upgrade', function() {
    return {
        onLoad: function() {
            client_form.on_residence_change();
            select_user_country();
            if(page.client.is_logged_in) {
                client_form.set_virtual_login_id(page.client.loginid);
                client_form.set_virtual_email_id(page.client.email);
            }
        }
    };
});
