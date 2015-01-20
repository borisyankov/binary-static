<script data-cfasync="false" type="text/javascript">
function receiveCmd(e){
  if (e.origin !== "https://cashier.binary.com") return;
  if (e.data.action == 'iframesize') {
    document.getElementById('cashiercont').style.height = (e.data.height) + "px";
  } else if (e.data.action == 'reloadwin') {
    window.location.reload(true);
  }
}
if (! window.addEventListener) {
  window.attachEvent("message", receiveCmd); 
} else {
  window.addEventListener("message", receiveCmd, false);
}
</script>

<iframe src="[%url%]" frameborder="0" width="100%" height="2000" id="cashiercont" scrolling="auto" style="padding:0px;margin:0px;"></iframe>
