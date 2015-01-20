function push_data_layer() {
    var info = gtm_data_layer_info();
    for (var i=0;i<info.length;i++) {
        dataLayer[0] = info[i].params;

        dataLayer.push(info[i].params);
        dataLayer.push({"event": info[i].event});
    }
}

onLoad.queue(push_data_layer);
