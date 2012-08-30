//This file is a framework file. It doesn't have anything that needs to be edited for an App.
//It needs to be included for the App to communicate with the container to have theming and responsive design injected.
//Any javascript that drives the App logic itself should be put in a separate file.


//Start - AppStore.Common.js

window.AppStore = window.AppStore || new Object();

//------------------------------------
// QueryString
//------------------------------------

window.AppStore.QueryString = {};

(function() {
	var loc = window.location.href;

	loc.replace(
		new RegExp("([^?=&]+)(=([^&]*))?", "g"),
		function($0, $1, $2, $3) { window.AppStore.QueryString[$1] = $3; }
	);
})();

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

	for (var idx = 0; idx < this._elements.length; idx++) {
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

window.AppStore.Context.prototype.removeContextElement = function(contextElement) {
	var matchString = contextElement.toString();
	var found = false;
	for (var idx = 0; idx < this._elements.length; idx++) {
		if (this._elements[idx].toString() == matchString) {
			delete this._elements[idx];
			this.sortElements();
			this._calcSignature();
			break;
		}
	}
};


window.AppStore.Context.prototype.toString = function() {
	var name;
	var keys = [];

	for (var idx = 0; idx < this._elements.length; idx++) {
		keys.push(this._elements[idx].getKey());
	}

	if (keys.length == 0) {
		name = "(empty)";
	}
	else if (keys.length == 1) {
		name = "(single) " + this.signature;
	}
	else {
		name = "(group) " + this.signature;
	}

	return name;
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
			PASSWORD: "urn:cba.caas.password",
			PIN: "urn:cba.caas.pin",
			PIQ: "urn:cba.caas.piq",
			CR_2FA: "urn:cba.caas.2fa.sms",
			RO_2FA: "urn:cba.caas.2fa.token"
		},
		STAFF: {
			PASSWORD: "urn:oasis:names:tc:SAML:1.0:am:password",
			KERBEROS: "urn:ietf:rfc:1510",
			TLS: "urn:ietf:rfc:2246",
			PKI_X509: "urn:oasis:names:tc:SAML:1.0:am:X509-PKI"
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
			LAUNCH_DATA_SET: "appstore.container.launchdata.set",
			CONTEXT_SET: "appstore.container.context.set",
			CONTEXT_FRAGMENT_SET: "appstore.container.context.fragment.set",
			BINDINGS_SET: "appstore.container.context.set",
			THEME_SET: "appstore.container.theme.set",

			APP_SEARCH_RESULTS: "appstore.container.app.searchresults",

			REFRESH: "appstore.container.comand.refresh",
			RESIZE: "appstore.container.command.resize",

			// ...

			ERROR: "appstore.container.command.error",
			ALL: "appstore.container.**"
		},
		FROM_APP: {
			// app -> container

			LAUNCH_DATA_GET: "appstore.app.launchdata.get",
			CONTEXT_GET: "appstore.app.context.get",
			CONTEXT_UPDATE: "appstore.app.context.update",
			CONTEXT_FRAGMENT_UPDATE: "appstore.app.context.fragment.update",

			BINDINGS_GET: "appstore.app.bindings.get",

			APP_READY: "appstore.app.ready",

			APP_LAUNCH: "appstore.app.launch",
			APP_CLOSE: "appstore.app.close",
			APP_SEARCH: "appstore.app.search",

			RESIZE_REQUEST: "appstore.app.resize.request",

			// ...

			ALL: "appstore.app.**"
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


//End - AppStored.Common.js

//Start - AppStore.App.js

/// <reference path='AppStore.Common.js' />

window.AppStore = window.AppStore || new Object();

AppStore.isApp = (window.AppStore.QueryString["oahpv"] == "openajax-2.0");

// if using jQuery then delay the ready event
if (AppStore.isApp && typeof (jQuery) != "undefined") {
	window.AppStore.useJQuery = true;
	$.holdReady(true);
}

window.AppStore.App = {
	//------------------------------------
	// constants
	//------------------------------------

	EVENTS: {
		ON_LAUNCH_DATA_RECEIVED: 'onLaunchDataReceived',
		ON_APP_SEARCH_RESULTS: 'onAppSearchResults',
		ON_CONTAINER_ERROR: 'onContainerError',
		ON_CONTEXT_CHANGE: 'onContextChange',
		ON_THEME_CHANGE: 'onThemeChange'
	},

	//------------------------------------
	// properties
	//------------------------------------

	initialised: false,
	initialising: false,
	autoReadyMessage: true,
	isReadyMessageSent: false,

	origin: '',

	subscriptions: {},
	messageHandlers: {},
	clientCallbacks: {},

	//------------------------------------
	// OpenAjax
	//------------------------------------

	// these should be private

	createContainerMessage: function(payload) {
		// add out of band stuff
		var message = {
			appInstanceId: this.appInstanceId,
			payload: payload
		};

		return message;
	},

	subscribe: function(topic, callbackFunction, scope, callbackData) {
		var subscription = this.hubClient.subscribe(topic, callbackFunction, scope, callbackData);
		this.subscriptions[topic] = subscription;
	},

	publish: function(topic, payload) {
		if (AppStore.isApp) {
			var message = this.createContainerMessage(payload);
			this.hubClient.publish(topic, message);
		}
	},

	unSubscribe: function(topic) {
		if (subscriptions[topic]) {
			this.hubClient.unsubscribe(topic);
			delete this.subscriptions[topic];
		}
	},

	onOpenAjaxMessage: function(topic, message) {
		// do NOT throw an unhandled error here or the lights go out
		try {
			var payload = message.payload;
			var appInstanceId = message.appInstanceId;

			if (appInstanceId == this.appInstanceId || appInstanceId == AppStore.Constants.BROADCAST) {
				// see if there is a handler defined
				var handler = this.messageHandlers[topic];

				if (handler) {
					// haven't figured out why storing the handler functions in an array makes them revert back to having window as their scope
					// so using .apply() to set scope to this
					handler.apply(this, arguments);
				}
				else {
					// deal with special cases
					switch (topic) {
						default:
							this.logError('onOpenAjaxMessage', 'Invalid message received: topc = \'' + topic + '\'');
							break;
					}
				}
			}
		}
		catch (ex) {
			this.logError('onOpenAjaxMessage', this.formatExceptionData(ex) + ', topic = \'' + topic + '\'');
		}
	},

	//------------------------------------
	// message handlers
	//------------------------------------

	onLaunchDataReceived: function(topic, message, subscriberdata) {
		var payload = message.payload;
		this.user = payload.user;
		this.context = new AppStore.Context(payload.context._elements);  // NOTE: must use the private member _elements instead of getElements() because payload is stringified - no code
		this.manifest = payload.manifest;
		this.bindings = payload.bindings;
		this.dataSources = payload.dataSources;
		this.params = payload.params;
		this.themes = payload.themes;

		var callback = this.clientCallbacks[this.EVENTS.ON_LAUNCH_DATA_RECEIVED];

		if (callback) {
			callback.fn.call(callback.scope, payload);
		}

		callback = this.onInitComplete;

		if (callback) {
			callback();
		}

		this.initialised = true;

		if (AppStore.useJQuery) {

			var proxy = $.proxy(this.sendReadyMessage, this);
			if (this.autoReadyMessage === true) {
				$(document).ready(function() { setTimeout(proxy, 250); });
			}
			else {
				// if app fails to load, get rid of the spinner after 
				$(document).ready(function() { setTimeout(proxy, 4000); });
			}

			$.holdReady(false);
		}
	},

	onSetContext: function(topic, message, subscriberdata) {
		this.prevContext = this.context;
		this.context = new AppStore.Context(message.payload.context._elements);

		var callback = this.clientCallbacks[this.EVENTS.ON_CONTEXT_CHANGE];

		if (callback) {
			callback.fn.call(callback.scope, this.context, this.prevContext);
		}
	},

	onAppSearchResults: function(topic, message, subscriberdata) {

		var results = message.payload;

		var callback = this.clientCallbacks[this.EVENTS.ON_APP_SEARCH_RESULTS];

		if (callback) {
			callback.fn.call(callback.scope, results);
		}
	},

	onContainerError: function(topic, message, subscriberdata) {
		var callback = this.clientCallbacks[this.EVENTS.ON_CONTAINER_ERROR];

		if (callback) {
			callback.fn.call(callback.scope, message.payload);
		}
		else {
			var err = $.extend(true, new AppStore.Error(0, ""), message.payload);
			this.logError("onContainerError", err.toString());
			alert("Container error: code = " + err.errorCode + ", message = '" + err.message + "'");
		}
	},

	initMessageHandlers: function() {
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_CONTAINER.LAUNCH_DATA_SET] = this.onLaunchDataReceived;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_CONTAINER.CONTEXT_SET] = this.onSetContext;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_CONTAINER.APP_SEARCH_RESULTS] = this.onAppSearchResults;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_CONTAINER.ERROR] = this.onContainerError;
	},

	//------------------------------------
	// OpenAjax callbacks
	//------------------------------------

	onHubSecurityAlert: function(src, atyp) {
		// TODO
		return true;
	},

	onHubConnect: function(hubClient, success, err) {
		if (success) {
			this.hubClient = hubClient;
			this.appInstanceId = hubClient.getClientID();
			this.subscribe(AppStore.Constants.TOPIC.FROM_CONTAINER.ALL, this.onOpenAjaxMessage, this, null);
			this.publish(AppStore.Constants.TOPIC.FROM_APP.LAUNCH_DATA_GET, {});
		}
		else {
			// TODO: this.logError 
		}
	},

	//------------------------------------
	// OpenAjax initialisation
	//------------------------------------

	initHub: function() {
		this.hub = new OpenAjax.hub.IframeHubClient({
			scope: this,

			HubClient: {
				onSecurityAlert: this.onHubSecurityAlert
			}
		}
	    );

		this.hub.connect(this.onHubConnect, this);
	},

	//------------------------------------
	// Bindings management
	//------------------------------------

	// TODO: does this need to handle versions?
	findUIBindingsByEndPointId: function(interfaceId) {
		var bindings = [];

		for (var idx = 0; idx < this.bindings.ui.length; idx++) {
			var binding = this.bindings.ui[idx];

			if (binding.interfaceId == interfaceId) {
				bindings.push(binding);
			}
		}

		return bindings;
	},

	//------------------------------------
	// Container communication
	//------------------------------------

	navigate: function(endPointId, params, launchMode, otherFlags) {
		launchMode = launchMode || AppStore.Constants.LAUNCH_MODE.CLOSE_AND_REPLACE;
		otherFlags = otherFlags || {};  //TODO: go through individual flags and set defaults for any that are missing

		var payload = {
			endPointId: endPointId,
			launchMode: launchMode,
			flags: otherFlags, // not sure what these might be yet
			params: params
		};

		this.publish(AppStore.Constants.TOPIC.FROM_APP.APP_LAUNCH, payload);
	},

	canNavigate: function(endPointId) {
		var bindings = this.findUIBindingsByEndPointId(endPointId);
		return bindings.length > 0;
	},

	close: function(returnValue) {
		var payload = {
			returnValue: returnValue
		};

		this.publish(AppStore.Constants.TOPIC.FROM_APP.APP_CLOSE, payload);
		this.hubClient.disconnect();
	},

	setContext: function(newContext) {
		var payload = {
			context: newContext
		};

		this.context = newContext;
		this.publish(AppStore.Constants.TOPIC.FROM_APP.CONTEXT_UPDATE, payload);
	},

	holdReadyMessage: function() {
		this.autoReadyMessage = false;
	},

	sendReadyMessage: function() {
		if (this.isReadyMessageSent == false) {
			this.isReadyMessageSent = true;
			this.publish(AppStore.Constants.TOPIC.FROM_APP.APP_READY, {});
		}
	},

	//------------------------------------
	// container services
	//------------------------------------

	appSearch: function(params) {
		var payload = {
			params: params
		};

		this.publish(AppStore.Constants.TOPIC.FROM_APP.APP_SEARCH, payload);
	},

	//------------------------------------
	// client callbacks
	//------------------------------------

	bind: function(eventName, fn, scope, data) {
		this.clientCallbacks[eventName] = {
			fn: fn,
			scope: scope,
			data: data
		};
	},

	//-----------------------------------
	// logging
	//-----------------------------------

	LOGGING_LEVELS: {
		VERBOSE: 0,
		INFO: 1,
		WARNING: 2,
		ERROR: 3,
		CRITICAL: 4
	},

	debugMinLevel: 0,

	debugSource: 'AppBase',

	logVerbose: function(method, text) {
		this.debugLog(this.LOGGING_LEVELS.VERBOSE, this.debugSource, method, text);
	},

	logMsg: function(method, text) {
		this.debugLog(this.LOGGING_LEVELS.INFO, this.debugSource, method, "logMsg is deprecated, please use logInfo");
		this.logInfo(method, text);
	},

	logInfo: function(method, text) {
		this.debugLog(this.LOGGING_LEVELS.INFO, this.debugSource, method, text);
	},

	logWarning: function(method, text, ex) {
		this.debugLog(this.LOGGING_LEVELS.WARNING, this.debugSource, method, text, ex);
	},

	logError: function(method, text, ex) {
		this.debugLog(this.LOGGING_LEVELS.ERROR, this.debugSource, method, text, ex);
	},

	logCritical: function(method, text, ex) {
		this.debugLog(this.LOGGING_LEVELS.CRITICAL, this.debugSource, method, text, ex);
	},

	debugLog: function(level, source, method, text, ex) {
		if (level >= this.debugMinLevel) {
			if (window.console) {
				var msg = source + ((method && method.length > 0) ? "." + method : '') + ': ' + text;
				window.console.log(msg);
				if (ex) {
					window.console.log(msg);
				}
			}
		}
	},

	formatExceptionData: function(ex) {
		var msg = "";

		if (ex.stack) {
			msg = ex.stack;
		} else if (ex.Source) {
			msg = "Source: " + ex.Source + ", Description: " + ex.Description + ", ErrorNumber: " + ex.ErrorNumber + ", Line: " + ex.Line + ", Severity: " + ex.Severity + ", Column: " + ex.Column;
		} else {
			msg = ex.toString();
		}

		return msg;
	},

	//------------------------------------
	// initialisation
	//------------------------------------

	init: function() {
		if (!AppStore.isApp) {
			return;
		}

		if (!this.initialised) {
			if (!this.initialising) {
				this.initialising = true;
				this.initMessageHandlers();

				// if app is run outside of the container then this will throw an error
				try {
					this.initHub();
				}
				catch (ex) {
					var pagebusMsg = (window.OpenAjax) ? "" : ", OpenAjax library not found";

					this.logError("init", "OpenAjax initialisation failed" + pagebusMsg);
					this.initialised = true;

					if (this.onInitComplete) {
						this.onInitComplete();
					}
				}
			}
		}
	},

	// ready() is for apps that don't use jQuery.  If you use jQuery then just use the jQuery ready() event.
	ready: function(onInitComplete) {
		try {
			this.onInitComplete = onInitComplete;

			if (!this.initialised) {
				this.init();
			}
			else {
				onInitComplete();
			}
		}
		catch (ex) {
			this.logError("ready", "Error initialising, ex.Message = " + ex.Message);
		}
	}
};

// The OpenAjax code needs the body element to exist, so if the .js files have been included in the <head> we need to 
// wait until the body element is created
(function() {
	function checkForBody() {
		if (!document.body) {
			window.setTimeout(function() { checkForBody(); }, 5);
		}
		else {
			AppStore.App.init();
		}
	}
	checkForBody();
})();

//End - AppStore.App.js

//Start - AppStore.Theme.js

window.AppStore = window.AppStore || new Object();

window.AppStore.Theme = {

	init: function() {

		var themes = AppStore.App.themes;
		if (themes) {
			var html = "";
			var head = document.getElementsByTagName('head')[0];
			var bgScript = document.createElement('script');
			bgScript.type = 'text/javascript';

			getContainerStylesheets();
			getCustomStylesheets();

			head.innerHTML += html;
			head.appendChild(bgScript);


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
		}
	}
};

$(document).ready(function() {
	AppStore.Theme.init();
});


//End - AppStore.Theme.js
