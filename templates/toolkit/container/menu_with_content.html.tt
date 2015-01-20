<div class="content-tab-container[%IF menu_and_content_wrapper_class %][% ' ' _ menu_and_content_wrapper_class %][% END %]"[% IF menu_and_content_wrapper_id %] id="[% menu_and_content_wrapper_id %]"[% END %]>
    <div class="tab-menu"><div class="tab-menu-wrap grd-container">[% menu %]</div></div>
    <div class="tab-content grd-container">
        <div class="tab-content-wrapper[% IF menu_has_sub_items %] menu-has-sub-item[% END %]"[% IF content_wrapper_id %] id="[% content_wrapper_id %]"[% END %]>
            [% IF content %]
                [% content %]
            [% ELSE %]
                [% FOREACH item IN menu_content %]
                    <div id="[% item.id %]-content" class="toggle-content[% IF item.class %] [% item.class %][% END %]">
                        [% item.content %]
                    </div>
                [% END %]
            [% END %]
        </div>
        [% IF bottom_style == 'round' %]<span class="br"></span><span class="bl"></span>[% END %]
    </div>
</div>
