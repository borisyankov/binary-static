$(function() {

    function validate($parent) {
        $('.error').remove();
        $parent.find('input, select').each(function() {
            if ($(this).val() === '') {
                var $el = $(this);
                if ($el.parent().is('p')) {
                    $el = $el.parent();
                }
                if ($el.parent().is('.dob')) {
                    $el = $el.parent().parent();
                }
                $el.after('<div class="error">You can\'t leave this empty</div>');
            }
        });
        $('.error + .error').remove();
        return $('.error').length === 0;
    }

    $('form[novalidate]').on('submit', function(e) {
        var $form = $(this);
        $form.find('.error').remove();
        if (validate($form)) {
            $form.find('img').toggleClass('spinner');
        }
        e.preventDefault();
    });

    $('*[data-modal]').on('click', function() {

        var modal = $(this).attr('data-modal');

        $(modal).show();
        $('.overlay').removeClass('hidden');
        $(modal).trigger('modalShow');
    });

    $('.overlay').on('click', function(e) {

        if (!$(e.target).hasClass('overlay')) return;

        $('.overlay').addClass('hidden');
        setTimeout(function() {
            $('.overlay form').hide();
        }, 200);

        $(this).find('form').trigger('modalHide');
    });

    $('#real-account-form').on('modalShow', function() {
        currentStep = 0;
        gotoStep[currentStep]();
    });

    $('form').on('modalShow', function() {
        $(this).find('.error').hide();
        $(this).find('input').val('');
        $('.form-logo').removeClass('spinner');
    });

    var gotoStep = [
        function step1() {
            $('.step1').show();
            $('.step2').hide();
            $('.step3').hide();
        },
        function step2() {
            $('.step1').hide();
            $('.step2').show();
            $('.step3').hide();
        },
        function step3() {
            $('.step1').hide();
            $('.step2').hide();
            $('.step3').show();
        },
        function step4() {
            $('#real-account-form img').toggleClass('spinner');
            $('#open-real-acount').prop('disabled', true);
        }
    ];

    function gotoStep4() {
        $form.find('img').toggleClass('spinner');
    }

    $('#open-real-acount').on('click', function(e) {

        var valid = validate($('.step' + (currentStep + 1)));

        e.preventDefault();
        if (valid) {
            currentStep++;
            $('[class^=step]').hide();
            gotoStep[currentStep]();
        }
    });
});
