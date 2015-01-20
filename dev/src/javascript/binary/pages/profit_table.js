onLoad.queue_for_url(function() {
    $('#profit-table-date').on('change', function() {
        $('#submit-date').removeClass('invisible');
    });
}, 'profit_table');
