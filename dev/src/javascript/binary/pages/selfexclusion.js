onLoad.queue_for_url(function () {

    $('#EXCLUDEUNTIL').pickadate({
        minDate: moment().subtract(6, 'months').toDate(),
        maxDate: moment.add(5, 'years').toDate()
    });

    $('#selfExclusion').on('click', '#self_exclusion_submit', function () {
        return client_form.self_exclusion.validate_exclusion_date();
    });
}, 'self_exclusion');
