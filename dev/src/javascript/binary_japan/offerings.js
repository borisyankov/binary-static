if(typeof JAPAN === 'function'){
	var _contractForms = Offerings.contractForms.bind({});
	Object.defineProperties(Offerings,{
		contractForms:{
			value:function(){
				var forms = _contractForms();
				delete forms['risefall'];
				return forms;
			}
		},
		getOfferings: {
			value:function(underlying){
				var params = { 
					offerings: 1,
					market: 'Forex',
					submarket: 'Major Pairs',
					start_type: 'spot'
		    	};
				TradeSocket.send(params);
			}
		}
	});
}