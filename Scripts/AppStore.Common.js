// AppStore.Common.js

window.AppStore = window.AppStore || new Object();

//------------------------------------
// AppDescriptor
//------------------------------------

window.AppStore.AppDescriptor = function(publisherId, appId, version) {
	this.publisherId = publisherId;
	this.appId = appId;
	this.version = version || '*';
	this.fqId = publisherId + '.' + appId + ((version && version != "*") ? '.v' + version : '');
};

window.AppStore.AppDescriptor.prototype.toString = function() {
	return this.fqId;
};

//------------------------------------
// Context
//------------------------------------

window.AppStore.ContextElement = function(namespace, contextType, data) {
	this.namespace = namespace;
	this.contextType = contextType;
	this.data = data;
};

window.AppStore.ContextElement.prototype.getKey = function() {
	return this.namespace + "::" + this.contextType;
};

window.AppStore.ContextElement.prototype.clone = function() {
	return new AppStore.ContextElement(this.namespace, this.contextType, $.extend(true, {}, this.data));
};

window.AppStore.ContextElement.prototype.toString = function() {
	var s = this.namespace + "::" + this.contextType + "-" + JSON.stringify(this.data);
	return s;
}

window.AppStore.Context = function(elements) {
	this._elements = [];

	if (elements) {
		if (elements.constructor == Array) {
			for (var idx = 0; idx < elements.length; idx++) {
				this.addNewContextElement(elements[idx].namespace, elements[idx].contextType, elements[idx].data);
			}
		}
		else {
			for (var key in elements) {
				this.addNewContextElement(elements[key].namespace, elements[key].contextType, elements[key].data);
			}
		}
	}

	this.signature = '';
	this.sortElements();
	this._calcSignature();
};

window.AppStore.Context.prototype.getElements = function() {
	return this._elements;
}

window.AppStore.Context.prototype.sortElements = function() {
	this._elements.sort(function(a, b) {
		var dir = 0;
		var ak = a.getKey();
		var bk = b.getKey();

		if (ak > bk) {
			dir = 1;
		}
		else if (ak < bk) {
			dir = -1;
		}
	
		return dir;
	});
}


window.AppStore.Context.prototype._calcSignature = function() {
	var keys = [];

	for (var idx = 0; idx < this._elements.length; idx++ ) {
		// TODO: this could go recursively through the actual data and make a key out the names or the names+values
		keys.push(this._elements[idx].getKey());
	}

	if (keys.length == 0) {
		keys[0] = "(_none_)";
	}

	this.signature = keys.join("+");
	return this.signature;
};


window.AppStore.Context.prototype.addNewContextElement = function(namespace, contextType, data) {
	var newElement = new AppStore.ContextElement(namespace, contextType, data);
	this._elements.push(newElement);
	this.sortElements();
	this._calcSignature();
};

window.AppStore.Context.prototype.addContextElement = function(newElement) {
	this._elements.push(newElement);
	this.sortElements();
	this._calcSignature();
};

window.AppStore.Context.prototype.removeContextElement = function (contextElement) {
	var matchString = contextElement.toString();
	var found = false;
	for (var idx = 0; idx < this._elements.length; idx++) {
		if (this._elements[idx].toString() == matchString) {
			//delete this._elements[idx];
			this._elements.splice(idx, 1);
			this.sortElements();
			this._calcSignature();
			break;
		}
	}
};


window.AppStore.Context.prototype.toString = function() {
	var name;
	var keys = [];
	var data = "";

	for (var idx = 0; idx < this._elements.length; idx++) {
		keys.push(this._elements[idx].getKey());
		data = data + (data.length > 0 ? " || " : "") + this._elements[idx].toString();
	}

	if (keys.length == 0) {
		name = "(empty)";
	}
	else if (keys.length == 1) {
		name = "(single) ";
	}
	else {
		name = "(multi) ";
	}

	return name + data;
};

window.AppStore.Context.WELL_KNOWN_NAMESPACES = {
	//	APPSTORE: "http://commbank.com.au/appstore/dataTypes.v1.xsd"
	//	CBA: "http://commbank.com.au/CBA/dataTypes.v1.xsd"
	// temporarily blank while fixing an issue in the JSON serialisation
	APPSTORE: "",
	CBA: ""
};

window.AppStore.Context.WELL_KNOWN_CONTEXTS = {
	APP: new AppStore.ContextElement(window.AppStore.Context.WELL_KNOWN_NAMESPACES.APPSTORE, "AppEntity", { publisherId: "", appId: "", version: "" }),
	CUSTOMER: new AppStore.ContextElement(window.AppStore.Context.WELL_KNOWN_NAMESPACES.CBA, "CustomerEntity", { customerId: "", customerIdType: "" }),
	ACCOUNT: new AppStore.ContextElement(window.AppStore.Context.WELL_KNOWN_NAMESPACES.CBA, "AccountEntity", { accountId: "", accountIdType: "" })
};


//------------------------------------
// Errors
//------------------------------------

window.AppStore.Error = function(errorCode, message) {
	this.errorCode = errorCode;
	this.message = message;
	// TODO: add some more fields here?
};

window.AppStore.Error.toString = function() {
	return "Error: code = " + this.errorCode + ", message = '" + this.message + "'";
};

//------------------------------------
// Constants
//------------------------------------

window.AppStore.Constants = window.AppStore.Constants || {
	APP_MODE: {
		IFRAME: 'iframe',
		INLINE: 'inline',
		SCHULTZ: 'schultz'
	},

	PERMITTED_CONSUMER: {
		USER: {
			ANONYMOUS: 'UserAnonymous',
			USER_AUTHENTICATED_ANY: 'UserAuthenticatedAny',
			USER_AUTHENTICATED_SPECIFIC: 'UserAuthenticatedSpecific'
		}
	},

	AUTHENTICATION_LEVEL: {
		CUSTOMER: {
			ANONYMOUS: "urn:anonymous",
			PASSWORD: "urn:password",
			PIN_ANY: "urn:pin",
			PIQ: "urn:piq",
			CR_2FA: "urn:2fa.cr.sms",
			RO_2FA: "urn:2fa.ro.token"
		},
		CBA_STAFF: {
			PASSWORD: "urn:cba.password",
			KERBEROS: "urn:cba.kerberos"
		}
	},

	LAUNCH_TAGS: {
		CONTAINER_LAUNCH: "Launch",
		APP_LAUNCH: "ContainerLaunch"
	},

	CONTEXT_ELEMENT_ID: {
		APP: "app",
		CUSTOMER: "customer",
		ACCOUNT: "account"
	},

	TOPIC: {
		FROM_CONTAINER: {
			LAUNCH_DATA_SET: "helix.container.launchdata.set",
			CONTEXT_SET: "helix.container.context.set",
			CONTEXT_FRAGMENT_SET: "helix.container.context.fragment.set",
			BINDINGS_SET: "helix.container.context.set",
			THEME_SET: "helix.container.theme.set",
			THEME_ADJUST: "helix.container.theme.adjust",

			APP_SEARCH_RESULTS: "helix.container.app.searchresults",

			REFRESH: "helix.container.comand.refresh",
			RESIZE: "helix.container.command.resize",

			// ...

			ERROR: "helix.container.command.error",
			ALL: "helix.container.**"
		},
		FROM_APP: {
			// app -> container

			LAUNCH_DATA_GET: "helix.app.launchdata.get",
			CONTEXT_GET: "helix.app.context.get",
			CONTEXT_UPDATE: "helix.app.context.update",
			CONTEXT_FRAGMENT_UPDATE: "helix.app.context.fragment.update",

			BINDINGS_GET: "helix.app.bindings.get",

			APP_READY: "helix.app.ready",

			APP_LAUNCH: "helix.app.launch",
			APP_CLOSE: "helix.app.close",
			APP_SEARCH: "helix.app.search",

			RESIZE_REQUEST: "helix.app.resize.request",

			// Security

			SECURITY_REFRESH_APP_TOKEN: "appstore.app.appsessiontoken.refresh",
			SECURITY_REFRESH_CONTAINER_TOKEN: "appstore.app.containersessiontoken.refresh",
			SECURITY_STEP_UP: "appstore.app.stepup",
			SECURITY_REAUTH: "appstore.app.reauth",
			SECURITY_SIGNOUT: "appstore.app.signout",

			// ...

			ALL: "helix.app.**"
		}
	},

	// special client id for broadcast messages
	BROADCAST: "*",

	// error codes

	SUCCESS: 0,

	ERROR: {
		SUCCESS: {
			errorNumber: 0,
			message: "It's all good."
		},

		ENVIRONMENT_MISSING: {
			errorNumber: 1002,
			message: "No environment config info found for current runtime."
		}
	},

	LAUNCH_MODE: {
		MODAL: 'modal',
		CLOSE_AND_REPLACE: 'closeAndReplace',
		HIDE_CURRENT: 'hideCurrent'
		// TODO: more modes, I think...        

	}

};

//------------------------------------
// QueryString helper class
//------------------------------------

window.AppStore.QueryString = function(url) {

	if (!url) {
		url = window.location.href;
	}

	function parseQS(url, obj) {
		url.replace(
			new RegExp("([^?=&]+)(=([^&#]*))?", "g"),
			function($0, $1, $2, $3) { obj[$1] = unescape($3); }
		);
	}

	parseQS(url, this);
};

window.AppStore.QueryString.current = new window.AppStore.QueryString();


//------------------------------------
// URL helper class
//------------------------------------

window.AppStore.parseURL = function(url) {
	var a = document.createElement('a');
	a.href = url;
	// hack for IE
	a.href = a.href;
	var file = (a.pathname.match(/([^\/?#]+)$/i) || [, ''])[1];
	var extension = (file.match(/\.([^\.]+)$/) || [, ''])[1];
	var path = a.pathname.replace(/^([^\/])/, '/$1');
	var segments = a.pathname.replace(/^\//, '').split('/');
	var folder = path.substr(0, path.length - file.length);

	return {
		source: url,
		protocol: a.protocol.replace(':', ''),
		host: a.hostname,
		port: a.port,
		query: a.search,
		params: (function() {
			var ret = {},
			seg = a.search.replace(/^\?/, '').split('&'),
			len = seg.length, i = 0, s;
			for (; i < len; i++) {
				if (!seg[i]) { continue; }
				s = seg[i].split('=');
				ret[s[0]] = s[1];
			}
			return ret;
		})(),
		file: file,
		extension: extension,
		hash: a.hash.replace('#', ''),
		path: path,
		relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
		segments: segments,
		origin: a.protocol + "//" + a.hostname + ((a.port != "" && a.port != 80 && a.port != 443 && a.port != 0) ? ":" + a.port : ""),
		folder: folder
	};
};

//------------------------------------
// Theme helper class
//------------------------------------

window.AppStore.Theme = {

	initialised: false,

	init: function() {
		if (this.initialised) {
			return;
		}

		this.initialised = true;

		var themes = AppStore.App.themes;
		if (themes) {

			function getContainerStylesheets() {
				var containerResourcePath = themes.containerPath + "/Styles/" + themes.containerTheme + "/";
				for (var idx in themes.container) {
					html += "<link href=\"" + containerResourcePath + themes.container[idx].name + ".css\" rel=\"stylesheet\" />";
				}
				// TODO temporary solution to passing in a javascript control
				bgScript.src = containerResourcePath + "Scripts/bg.js";
			};

			function getCustomStylesheets() {
				if (themes.containerTheme && themes.custom) {
					var fallbackThemeIndex = 0;

					for (var idx in themes.custom.theme) {
						var themeName = themes.custom.theme[idx].name;
						if (themes.containerTheme.toLowerCase() == themeName.toLowerCase()) {
							return generateLinks(idx);
						}

						if (themes.custom.fallback == themeName) {
							fallbackThemeIndex = idx;
						}
					}

					// if the container theme is not supported by the app use fallback theme
					return generateLinks(fallbackThemeIndex);
				}
			};

			function generateLinks(index) {
				var resource = themes.custom.theme[index];
				for (var i in resource.link) {
					html += "<link href=\"" + resource.link[i].href + "\" rel=\"stylesheet\" />";
				}
				return html;
			};

			var html = "";
			var head = document.getElementsByTagName('head')[0];
			var bgScript = document.createElement('script');
			bgScript.type = 'text/javascript';

			getContainerStylesheets();
			getCustomStylesheets();

			head.innerHTML += html;
			head.appendChild(bgScript);
		}
	}
};
