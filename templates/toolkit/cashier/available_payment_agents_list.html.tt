<div class="grd-parent grd-grid-12 grd-row-padding table-header">
    <div class="grd-grid-3">[% l('Name') %]</div>
    <div class="grd-grid-2">[% l('Summary') %]</div>
    <div class="grd-grid-2">[% l('Depo./With. commission') %]</div>
    <div class="grd-grid-5">[% l('Further information') %]</div>
</div>
[% FOREACH payment_agent IN payment_agent_table_row %]
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-3">[% payment_agent.name %]</div>
    <div class="grd-grid-2">[% payment_agent.summary %]</div>
    <div class="grd-grid-2">[% payment_agent.commission %]</div>
    <div class="grd-grid-5 further-info">
        <a href="#">[% l('Further information') %]</a>
        [% INCLUDE 'cashier/payment_agent_further_info.html.tt' %]
    </div>
 </div>
[% END %]
