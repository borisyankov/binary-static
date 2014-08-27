[% IF !full_width %]
</div> [% # closes grd-container %]
[% END %]
<div class="push"></div>
</div> [% # closes div#content %]
</div>[% #closes div#content-holder %]
<div id="footer">
    <div id="footer-menu">
        <div class="grd-container grd-default-container">
            <div class="grd-grid-6 grd-grid-mobile-12 grd-parent">
                <div class="grd-grid-4">
                    <div id="accounts_links" class="by_client_type client_logged_out client_virtual">
                        <h1>[% l('Accounts') %]</h1>
                        <ul>
                            <li>
                                <a class="by_client_type client_logged_out client_virtual pjaxload"
                                   href="[% request.url_for('linkto_acopening.cgi', {actype => 'real'}) %]"[% IF target %]
                                target="[% target %]"[% END %]>[% l('Trading Account') %]</a>
                            </li>
                            <li>
                                <a class="by_client_type client_logged_out pjaxload"
                                   href="[% request.url_for('linkto_acopening.cgi', { actype => 'virtual'}) %]"[% IF target
                                %]
                                target="[% target %]"[% END %]>[% l('Virtual Account') %]</a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h1>[% l('Partners') %]</h1>
                        <ul>
                            <li class="affiliate">
                                <a class="pjaxload" href="[% request.url_for('affiliate_signup.cgi') %]"[% IF target %]
                                target="[% target %]"[% END %]>[% l('Affiliate Program') %]</a>
                            </li>
                            <li>
                                <a href="[% request.url_for('white-labels') %]" class="pjaxload">[% l('White Labels') %]</a>
                            </li>
                            <li>
                                <a class="pjaxload" href="[% request.url_for('partnerapi') %]"[% IF target %] target="[%
                                target
                                %]"[% END %]>[% l('Partner API') %]</a>
                            </li>
                            <li>
                                <a href="[% request.url_for('open-source-projects') %]" class="pjaxload">[% l('Open Source') %]</a>
                            </li>
                        </ul>
                    </div>

                </div>
                <div class="grd-grid-4">
                    <h1>[% l('Education') %]</h1>
                    <ul>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('why-us') %]"[% IF target %] target="[% target
                            %]"[% END %]>[% l('Why Us?') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('get-started') %]"[% IF target %] target="[%
                            target
                            %]"[% END %]>[% l('Getting Started') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('tour') %]"[% IF target %] target="[% target
                            %]"[%
                            END %]>[% l('Platform Tour') %]</a>
                        </li>
                        <li>
                            <a href="http://www.gamcare.org.uk/" target="_blank">[% l('GamCare') %]</a>
                        </li>
                        <li>
                            <a href="http://blog.binary.com/webinar.html" target="_blank">[% l('Webinars') %]</a>
                        </li>
                    </ul>
                </div>
                <div class="grd-grid-4">
                    <h1>[% l('Trading') %]</h1>
                    <ul>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('tick_trades.cgi') %]"[% IF target %]
                            target="[%
                            target %]"[% END %]>[% l('Tick Trades') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('pricing_table.cgi') %]"[% IF target %]
                            target="[%
                            target %]"[% END %]>[% l('Pricing Table') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('rise_fall_table.cgi') %]"[% IF target %]
                            target="[% target %]"[% END %]>[% l('Rise/Fall Table') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('asset_index.cgi') %]"[% IF target %]
                            target="[%
                            target %]"[% END %]>[% l('Asset Index') %]</a>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="grd-grid-6 grd-grid-mobile-12 grd-parent">
                 <div class="grd-grid-4">
                    <h1>[% l('Banking') %]</h1>
                    <ul>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('available_payment_methods.cgi') %]"[% IF
                            target %]
                            target="[% target %]"[% END %]>[% l('Payment Methods') %]</a>
                        </li>
                    </ul>
                    <div class='grd-row-padding'>
                        <h1>[% l('Terms') %]</h1>
                        <ul>
                            <li>
                                <a class="pjaxload" href="[% request.url_for('c_template.cgi', {filecode => 'legal'}) %]"[%
                                IF
                                target %] target="[% target %]"[% END %]>[% l('Terms and Conditions') %]</a>
                            </li>
                            <li>
                                <a class="pjaxload"
                                   href="[% request.url_for('c_template.cgi', {filecode => 'legal'}) %]#privacy-tab"[% IF
                                target
                                %] target="[% target %]"[% END %]>[% l('Security and Privacy') %]</a>
                            </li>
                            <li>
                                <a class="pjaxload" href="[% request.url_for('responsible-trading') %]"[% IF target %]
                                target="[% target %]"[% END %]>[% l('Responsible Trading') %]</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="grd-grid-4">
                    <h1>[% l('Market Data') %]</h1>
                    <ul>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('chart_application.cgi') %]"[% IF target %] target="[% target %]"[% END %]>[% l('Chart Application') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('smartchart.cgi') %]"[% IF target %] target="[%
                            target %]"[% END %]>[% l('Light Charts') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('livechart.cgi') %]"[% IF target %] target="[%
                            target %]"[% END %]>[% l('Live Charts') %]</a>
                        </li>
                    </ul>
                </div>
                <div class="grd-grid-4">
                    <h1>[% l('About Us') %]</h1>
                    <ul>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('about-us') %]"[% IF target %] target="[%
                            target
                            %]"[% END %]>[% l('Group Information') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('group-history') %]"[% IF target %] target="[%
                            target
                            %]"[% END %]>[% l('Group History') %]</a>
                        </li>
                        <li>
                            <a href="[% request.url_for('us_patents.cgi') %]" class="us_patent_link pjaxload">[% l('Patents') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('careers') %]">[% l('Careers') %]</a>
                        </li>
                        <li class="blog">
                            <a href="http://blog.binary.com" target="_blank">[% l('Blog') %]</a>
                        </li>
                        <li>
                            <a href="http://binarycom.statuspage.io" target="_blank">[% l('Network Status') %]</a>
                        </li>
                        <li>
                            <a class="pjaxload" href="[% request.url_for('contact.cgi') %]"[% IF target %] target="[%
                            target
                            %]"[% END %]>[% l('Contact Us') %]</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <div id="footer-regulatory">
        <div class="grd-container grd-default-container">
            <div class="grd-grid-4 grd-grid-mobile-12 grd-grid-phablet-3 grd-parent">
                <div class="grd-grid-12 grd-hide-mobile"></div>
                <div class="grd-grid-12 grd-hide-mobile"></div>
                <div class="grd-grid-12 grd-hide-mobile"></div>
                <div class="grd-grid-4 grd-grid-phablet-12">
                    <a href="http://www.gov.im/gambling/" target="_blank">
                        <img id="iom_icon_footer" class="responsive" src="[% request.url_for('images/pages/footer/isle-of-man.png') %]"/>
                    </a>
                </div>
                <div class="grd-grid-6 grd-grid-phablet-12 grd-no-gutter-left">
                    <a href="http://www.lga.org.mt/lga/home.aspx" target="_blank">
                        <img id="lga_icon_footer" class="responsive" src="[% request.url_for('images/pages/footer/authority-malta.svg') %]"/>
                    </a>
                </div>
                <div class="grd-grid-2 grd-grid-phablet-12 grd-no-gutter">
                    <img id="eighteen_plus" class="responsive" src="[% request.url_for('images/pages/footer/eighteen-plus.svg') %]"/>
                </div>
            </div>
            <div class="grd-grid-6 grd-grid-mobile-12 grd-grid-phablet-7">
                <div id="regulatory-text">
                    [% l('This website is marketed in the UK by Regent Markets (IOM) Ltd., First Floor, Millennium House, Victoria Road, Douglas, IM2 4RW, Isle of Man, British Isles, regulated by the Gambling Supervision Commission in the Isle of Man, online gambling licence issued on 31 August 2012, and in the rest of the EU by Regent Markets (Malta) Ltd., Mompalao Building, Suite 2, Tower Road, Msida MSD1825, Malta, regulated by the Lotteries and Gaming Authority in Malta, licence no LGA/CL2/118/2000, 26th May 2010. This website\'s services are not made available in the USA, Japan or Hong Kong.')%]
                </div>
            </div>
            <div class="grd-grid-2 grd-grid-mobile-12 grd-centered-mobile">
                <div id="social-networks">
                    [% INCLUDE global/social.html.tt %]
                </div>
            </div>
        </div>
    </div>
    <div id="appcache-reload-message">
        <div class="message">
            [% l('A new version of the interface is available. Please refresh this page to try again.') %]
        </div>
    </div>
</div>[% #closes div#page-wrapper %]