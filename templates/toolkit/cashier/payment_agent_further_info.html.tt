<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
        [% l('Name') %]:
    </div> 
    <div class="grd-grid-8">
         [% payment_agent.name.replace("'", "\\'") %]
    </div> 
</div> 
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Service summary') %]:
    </div>
    <div class="grd-grid-8">
         [% payment_agent.summary.replace("'", "\\'") %]
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Website') %]:
    </div>
    <div class="grd-grid-8">
         <a href='[% payment_agent.url %]' target="_blank">[% payment_agent.url %]</a>
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Email') %]:
    </div>
    <div class="grd-grid-8">
         <a href="mailto:[% payment_agent.email %]" target="_blank">[% payment_agent.email %]</a>
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Tel') %]:
    </div>
    <div class="grd-grid-8">
         [% payment_agent.telephone%]
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Commission on deposits') %]:
    </div>
    <div class="grd-grid-8">
         [% payment_agent.deposit_commission%]%
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Commission on withdrawals') %]:
    </div>
    <div class="grd-grid-8">
         [% payment_agent.withdrawal_commission%]%
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body table-body-lines">
    <div class="grd-grid-4">
         [% l('Further information') %]:
    </div>
    <div class="grd-grid-8">
         [% payment_agent.further_information.replace("'", "\\'") %]
    </div>
</div>
<div class="grd-parent grd-grid-12 grd-row-padding table-body">
    [% FOREACH bank IN payment_agent.supported_banks.split(',') %]
        [% IF payment_agent_banks.$bank %]
    <a href="[% payment_agent_banks.$bank.url %]" rel="external"><img src="[% request.url_for(payment_agent_banks.$bank.image) %]" width="72" height="57" alt="[% payment_agent_banks.$bank.name %]" title="[% payment_agent_banks.$bank.name %]" /></a>
        [% END %]
    [% END %]
</div>
