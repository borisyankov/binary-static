var Contents = function(client) {
    this.client = client;
    this.tooltip = new ToolTip();
};

Contents.prototype = {
    on_load: function() {
        this.activate_by_client_type();
        this.update_body_id();
        this.tooltip.attach();
        this.init_draggable();
        this.display_live_chat();
    },
    on_unload: function() {
        this.tooltip.detach();
        if ($('.unbind_later').length > 0) {
            $('.unbind_later').off();
        }
    },
    activate_by_client_type: function() {
        $('.by_client_type').addClass('invisible');
        if (this.client.is_logged_in) {
            if (this.client.is_real) {
                $('.by_client_type.client_real').removeClass('invisible');
                $('.by_client_type.client_real').show();
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
    init_draggable: function() {
        $('.draggable').draggable();
    },
    display_live_chat: function() {
        $('#live-chat-container').hide();
    }
};
