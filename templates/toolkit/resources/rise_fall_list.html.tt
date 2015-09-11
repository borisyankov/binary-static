<div class="grd-grid-12 grd-row-padding table-header">
    <div class="grd-grid-4 center-aligned">[% l('Asset') %]</div>
    <div class="grd-grid-4 center-aligned">[% l('Rise Contract Return') %]</div>
    <div class="grd-grid-4 center-aligned">[% l('Fall Contract Return') %]</div>
</div>

[% SET displayed_row_count = 0 %]
[% FOREACH market IN fullinfo %]
    [% FOREACH submarket IN market.submarkets %]
            [% FOREACH underlying IN submarket.underlyings %]
                [% IF underlying.prices.rise != '--' %]
                <div class="grd-grid-12 grd-row-padding table-body table-body-lines">
                    <div class="grd-grid-4 center-aligned">[% underlying.name %]</div>
                    <div class="grd-grid-4 center-aligned">[% underlying.prices.rise %]</div>
                    <div class="grd-grid-4 center-aligned">[% underlying.prices.fall %]</div>
                </div>
                [% displayed_row_count = displayed_row_count + 1 %]
                [% END %]
            [% END %]
    [% END %]
[% END %]
