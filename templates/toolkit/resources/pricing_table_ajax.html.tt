[% BLOCK price_tab %]

[% center_index = 0 -%]
[% prices = expiries.1.prices -%]
[% FOREACH price IN prices %]
    [% center_index = loop.index %]
    [% LAST IF price.highlight %]
[% END %]

<div id="[% tabid %]_prices-content" class="[% class %] toggle-content">
    <div class="grd-parent grd-grd-grid-12 table-header grd-row-padding center-aligned">
        <div class="grd-grid-2">
            [% l('Expiry') %]
        </div>
        [%- FOREACH strike IN strikes %]
            <div class="grd-grid-1 grd-grid-mobile-2 [%- "grd-hide-mobile" IF (loop.index < center_index - 2 || loop.index > center_index + 2) %]">
                [% strike.absolute %]
            </div>
        [% END -%]
    </div>

    [% FOREACH expiry IN expiries -%]
    <div class="grd-parent grd-grd-grid-12 table-body grd-row-padding table-body-lines center-aligned">
          [% IF expiry.highlight -%]
            <div class="grd-grid-2" style="font-weight: bold">[% expiry.display %]</div>
          [%- ELSE -%]
            <div class="grd-grid-2">[% expiry.display %]</div>
          [%- END %]
          [%- FOREACH price IN expiry.prices -%]
            <div class="grd-grid-1 grd-grid-mobile-2 [%- "grd-hide-mobile" IF (loop.index < center_index - 2 || loop.index > center_index + 2) %]" [% IF price.highlight %]style="font-weight: bold"[% END %]>
                <a href="[% price.url %]">[% price.$tabid %]</a>
            </div>
          [% END -%]
    </div>
    [% END %]
</div>
[% END %]

  <div id="pricing_table_tabs" class="has-tabs">
       <ul>
          <li>
            <a href="#straight_prices">[% names.straight %]</a>
          </li>
          <li>
            <a href="#opposite_prices">[% names.opposite %]</a>
          </li>
       </ul>
       <div id='straight_prices'>
            [% PROCESS price_tab tabid='straight' %]
       </div>
       <div id='opposite_prices'>
           [% PROCESS price_tab tabid='opposite' %]
       </div>
  </div>
