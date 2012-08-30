window.AppStore = window.AppStore || {};

window.AppStore.Ajax = window.AppStore.Ajax || {

	init: function() {
		var _sid;
		var _additionalSettingKeys = { 'async': true, 'contentType': true, 'cache': true, 'accepts': true, 'dataType': true, 'mimeType': true, 'timeout': true };

		$.postJSON = function(url, data, settings) {
			var endpoints = [];
			var dataSources = [];

			if (window.AppStore) {
				if (window.AppStore.App) {
					if (window.AppStore.App.bindings && window.AppStore.App.bindings.data) {
						endpoints = window.AppStore.App.bindings.data;
					}

					if (window.AppStore.App.dataSources) {
						dataSources = window.AppStore.App.dataSources;
					}
				}
				else {
					if (window.AppStore.dataSources) {
						dataSources = window.AppStore.dataSources;
					}
				}
			}
			if (_sid) {
				//data._sid = _sid; // SID in data.
				url += (url.indexOf('?') < 0 ? '?' : '&') + 'sid=' + _sid; // SID in url.
			}
			// Exceptions: http://stackoverflow.com/questions/3589100/is-there-a-way-to-trap-all-errors-in-a-ajax-web-service
			var reqSettings = {
				url: url,
				type: 'POST',
				contentType: 'application/json; charset=utf-8',
				data: JSON.stringify(data || {}),
				dataType: 'text',
				headers: {
					"DataServiceEndPoints": JSON.stringify(endpoints),
					"DataSourceSet": JSON.stringify(dataSources)
				},
				dataFilter: function(data) {
					var msg = (typeof (data) == "string") ? $.parseJSON(data) : data;
					if (msg.sid) {
						_sid = msg.sid;
					}
					return msg.hasOwnProperty('d') ? msg.d : msg;
				}
			};

			if (settings) {
				reqSettings = $.extend(true, settings, reqSettings);
			}

			return $.ajax(reqSettings);
		};
	}

};

$(function() {
	window.AppStore.Ajax.init();
});
