/*
 * Handles start time display
 *
 * It process `Contract.startDates` in case of forward
 * starting contracts and populate the start time select
 * box
 */

function compareStartDate(a,b) {
    'use strict';
    if (a.date < b.date)
        return -1;
    if (a.date > b.date)
        return 1;
    return 0;
}

function displayStartDates() {
    'use strict';

    var startDates = Contract.startDates();

    if (startDates && startDates.list.length) {

        var target= document.getElementById('date_start'),
            fragment =  document.createDocumentFragment(),
            row = document.getElementById('date_start_row');

        row.style.display = 'flex';

        while (target && target.firstChild) {
            target.removeChild(target.firstChild);
        }

        if(startDates.has_spot){
            var option = document.createElement('option');
            var content = document.createTextNode(Content.localize().textNow);
            option.setAttribute('value', 'now');
            option.appendChild(content);
            fragment.appendChild(option);
        }

        startDates.list.sort(compareStartDate);

        startDates.list.forEach(function (start_date) {
            var a = moment.unix(start_date.open).utc();
            var b = moment.unix(start_date.close).utc();

            var ROUNDING = 5 * 60 * 1000;
            var start = moment();

            if(moment(start).isAfter(moment(a))){
                a = start;
            }

            a = moment(Math.ceil((+a) / ROUNDING) * ROUNDING).utc();

            while(a.isBefore(b)) {
                option = document.createElement('option');
                option.setAttribute('value', a.utc().unix());
                content = document.createTextNode(a.format('HH:mm ddd'));
                option.appendChild(content);
                fragment.appendChild(option);
                a.add(5, 'minutes');
            }
        });
        target.appendChild(fragment);
    } else {
        document.getElementById('date_start_row').style.display = 'none';
    }
}
