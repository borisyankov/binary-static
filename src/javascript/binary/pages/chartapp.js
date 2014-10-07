onLoad.queue(function () {
    'use strict';

    var isMac = /Mac/i.test(navigator.platform),
        isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent),
        isAndroid = /Android/i.test(navigator.userAgent),
        isWindowsPhone = /Windows Phone/i.test(navigator.userAgent),
        isJavaInstalled = (deployJava.getJREs().length > 0) && deployJava.versionCheck("1.5+"),
        isMobile = isIOS || isAndroid || isWindowsPhone,
        shouldBeInstalled = !isJavaInstalled && !isMobile;

    $('#install-java').toggle(shouldBeInstalled);
    $('#download-app').toggle(isJavaInstalled);

    $('#install-java').on('click', function () {
        deployJava.installLatestJRE();
    });

    $('#download-app').on('click', function () {
        if (isMac) {
            alert('You need to change your security preferences!');
            return;
        }

        if (isMobile) {
            alert('The charting app is not available on mobile devices!');
        }
    });
});
