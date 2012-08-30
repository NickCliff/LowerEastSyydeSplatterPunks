/// <reference path='AppStore.Common.js' />
/// <reference path='PageBus/full/pagebus.js' />
/// <reference path='jquery-1.7.2-vsdocs.js' />

window.AppStore = window.AppStore || {};

window.AppStore.Container = {

	//------------------------------------
	// constants
	//------------------------------------

	EVENTS: {
		ON_INIT_COMPLETE: 'onInitComplete',
		ON_APP_LAUNCH_REQUEST: 'onAppLaunchRequest',
		ON_APP_READY: 'onAppReady',
		ON_RESOLVE_APP_BINDING: 'onResolveAppBinding',
		ON_GET_APP_DISPLAY_CONTAINER: 'onGetAppDisplayContainer',
		ON_APP_LAUNCHED: 'onAppLaunched',
		ON_APP_CLOSE: 'onAppClose',
		ON_CONTEXT_CHANGE: 'onContextChange',
		ON_OA_SECURITYALERT: 'onOASecurityAlert',
		ON_OA_CONNECT: 'onOAConnect',
		ON_OA_DISCONNECT: 'onOADisconnect',
		ON_STATUS_MESSAGE: 'onStatusMessage'
	},

	BINDING_PERMISSIONS: {
		ANY_CONTAINER: "AnyContainer",
		SPECIFIC_CONTAINER: "SpecificContainer",
		ANY_PUBLISHER: "AnyPublisher",
		SPECIFIC_PUBLISHER: "SpecificPublisher",
		ANY_APP: "AnyApp",
		SPECIFIC_APP: "SpecificApp",
		USER: "UserBinding"
	},

	INVOKEBINDING_TYPES: {
		DATA: "InvokesInterfaceDataService",
		UI: "InvokesInterfaceUI"
	},

	INVOKEDATABINDING_TYPES: {
		CONTAINER: "InvokesInterfaceDataServiceBindingContainerService",
		APP: "InvokesInterfaceDataServiceBindingContainerService"
		// TODO: more types?
	},

	INVOKEUIBINDING_TYPES: {
		CONTAINER: "InvokesInterfaceUIBindingContainer",
		APP: "InvokesInterfaceUIBindingApp"
	},

	EXPOSEBINDING_TYPES: {
		DATA: "ExposesInterfaceDataService",
		UI: "ExposesInterfaceUI"
	},

	INVOKES_MODE: {
		MANDATORY: 1,
		OPTIONAL: 0
	},

	//------------------------------------
	// properties
	//------------------------------------
	// this needs to be set to something that gives this container a unique id if we are going to broadcast messages later on

	containerId: 'foo',

	// TODO: read this from container manifest
	containerAppDescriptor: new AppStore.AppDescriptor("CBA", "BaseContainer", "1.0.0"),

	// Used to store the auth token in the client. TODO: Should be retrieved only per app launch
	authToken: "",

	// TODO: this is a temporary value to indicate what theme the container is using - set in the container's js file
	containerTheme: null,

	//------------------------------------
	// utilities
	//------------------------------------

	idCounter: 0,

	generateId: function() {
		// TODO: could use some crypto here to make ids not easily guessable
		this.idCounter++;
		var newId = this.containerId + '-' + this.idCounter;
		return newId;
	},

	//------------------------------------
	// Security
	//------------------------------------

	identity: {

		// Specifies the URN for the user type e.g. "urn:cba.netbank", "urn:cba.commbiz"
		userType: "",

		// Specifies the URN for the authentication type e.g. "cba.caas.password"
		authenticationType: "",

		// The login ID / Sign on ID / username 
		userName: "Anonymous",

		// Maybe this will be used
		fullName: ""
	},

	//------------------------------------
	// Entitlements
	//------------------------------------

	Entitlements: {

		_appList: null,

		_container: window.AppStore.Container,

		matchUserType: function(a, b) {
			// Simple comparison for now - can grow this to include wild-carding
			//return (a == b);
			return true;
		},

		matchAuthenticationLevel: function(a, b) {
			// Simple comparison for now - can grow this to include wild-carding

			var authLevels = b.split("|");
			for (i = 0; i < authLevels.length; i++) {
				var authLevel = authLevels[i];
				if (a == authLevel)
					return true;
			}
			//return false;
			return true;
		},

		FilterByUserPermission: function() {
			var appList = [];

			for (var i = 0; i < this._appList.length; i++) {
				if (this._appList[i].bindings.exposes) {
					for (var idxExposed = 0; idxExposed < this._appList[i].bindings.exposes.length; idxExposed++) {

						// Search for the "ContainerLaunch" interface
						var interfaceId = this._appList[i].bindings.exposes[idxExposed].interfaceId;
						var permittedConsumers = this._appList[i].bindings.exposes[idxExposed].permittedConsumers;

						if (interfaceId == window.AppStore.Constants.LAUNCH_TAGS.APP_LAUNCH && permittedConsumers) {
							var userFilterApplied = false;
							for (var idxPermittedConsumer = 0; idxPermittedConsumer < permittedConsumers.length; idxPermittedConsumer++) {

								// Compare our current level of authentication to that required
								if (!userFilterApplied) {
									switch (permittedConsumers[idxPermittedConsumer].__type) {

										// Handle the Anonymous definition                                                                                      
										case window.AppStore.Constants.PERMITTED_CONSUMER.USER.ANONYMOUS:
											// Anything available to anonymous users is automatically added
											appList.push(this._appList[i]);
											userFilterApplied = true;
											break;

										case window.AppStore.Constants.PERMITTED_CONSUMER.USER.USER_AUTHENTICATED_SPECIFIC:
											// Check that we are the right type of user
											var matched = this.matchUserType(window.AppStore.Container.identity.userType, permittedConsumers[idxPermittedConsumer].userIdentifier);
											if (matched) {
												// Check that we have the right level of authentication
												matched = this.matchAuthenticationLevel(window.AppStore.Container.identity.authenticationType, permittedConsumers[idxPermittedConsumer].credentialRequired);
											}
											else {
												// Check if the identity contains references to other identifiers required
												if (window.AppStore.Container.identity.otherIdentifiers && window.AppStore.Container.identity.otherIdentifiers.length > 0) {
													for (idxOtherIdentifier = 0; idxOtherIdentifier < window.AppStore.Container.identity.otherIdentifiers.length; idxOtherIdentifier++) {
														matched = this.matchUserType(window.AppStore.Container.identity.userType, window.AppStore.Container.identity.otherIdentifiers[idxOtherIdentifier][0]);
														if (matched)
															break;
													}
												}
											}
											if (matched) {
												appList.push(this._appList[i]);
												userFilterApplied = true;
											}
											break;
										default:
											// don't add - but what does this really mean?
											break;
									}
								}
							}
						}
					}
				}
			}

			this._appList = appList;
		},

		GetList: function() {
			return this._appList;
		}

	},


	//------------------------------------
	// OpenAjax
	//------------------------------------
	hubPolicy: new PageBus.policy.HubPolicy(),

	// Max time we wait for an app to load in ms
	appLoadTimeout: 10000,

	// these are used by the container to send messages from its own client
	inlineHubContainer: null,
	inlineHubClient: null,

	// messaging permissons are controlled by origin, meaning root url e.g. https://www.my.combank.com.au

	containerOrigin: window.location.protocol + "//" + window.location.host,

	origins: {},

	// these are the types of messages that apps are allowed to subscribe and publish to
	// not sure whether we will allow some types of private messages between apps (CH thinks we should, just about everyone else doesn't)

	defaultMessagePolicies: {
		appSubscribe: [
		// for now granting everything, need to be more speific later
			AppStore.Constants.TOPIC.FROM_CONTAINER.ALL
		],

		appPublish: [
			AppStore.Constants.TOPIC.FROM_APP.ALL
		],

		containerSubscribe: [
		// for now listening to app messages only, may want to listen to container messages as well at some point e.g. distributed clients
			AppStore.Constants.TOPIC.FROM_APP.ALL
		],

		containerPublish: [
		// note that these permissions are domain based, so this actually means that anything in the same domain as the container can post anything
			'**'
		]
	},

	setContainerDefaultMessagePolicies: function() {
		var idx;

		if (!this.origins[this.containerOrigin]) {
			for (idx = 0; idx < this.defaultMessagePolicies.containerSubscribe.length; idx++) {
				this.hubPolicy.grant(this.containerOrigin, PageBus.policy.Ops.Subscribe, this.defaultMessagePolicies.containerSubscribe[idx]);
			}

			for (idx = 0; idx < this.defaultMessagePolicies.containerPublish.length; idx++) {
				this.hubPolicy.grant(this.containerOrigin, PageBus.policy.Ops.Publish, this.defaultMessagePolicies.containerPublish[idx]);
			}

			this.origins[this.containerOrigin] = this.containerOrigin;
		}
	},


	setAppDefaultMessagePolicies: function(origin) {
		var idx;

		if (!this.origins[origin]) {
			for (idx = 0; idx < this.defaultMessagePolicies.appSubscribe.length; idx++) {
				this.hubPolicy.grant(origin, PageBus.policy.Ops.Subscribe, this.defaultMessagePolicies.appSubscribe[idx]);
			}

			for (idx = 0; idx < this.defaultMessagePolicies.appPublish.length; idx++) {
				this.hubPolicy.grant(origin, PageBus.policy.Ops.Publish, this.defaultMessagePolicies.appPublish[idx]);
			}

			this.origins[origin] = origin;
		}
	},

	//monitor callback methods

	// container can regiser its own callbacks
	onPublishCallbacks: [

	],

	registerOnPublishCallback: function(callbackFunction) {
		var idx = this.onPublishCallbacks.length;
		this.onPublishCallbacks[idx] = callbackFunction;
		return idx;
	},

	unregisterOnPublishCallback: function(idx) {
		if (idx < this.onPublishCallbacks.length) {
			this.onPublishCallbacks[idx] = null;
		}
	},

	onOAPublish: function(topic, data, pcon, scon) {
		var result = true;
		for (var idx = 0; idx < this.onPublishCallbacks.length; idx++) {
			var fn = this.onPublishCallbacks[idx];
			if (fn) {
				try {
					// any of these handlers can cancel publishing the message
					result = result && fn(topic, data, pcon, scon);
				}
				catch (ex) {
					this.logError('onOAPubish', this.formatExceptionMessage(ex), ex);
				}
			}
		}

		return result;
	},

	onOASubscribe: function(topic, scon) {
		//TODO: Would a callback be useful here?

		// prevent duplicate subscriptions from the app (e.g. after page refresh)
		var _d = scon._delegate;

		if (_d) {
			_d.existingSubs = _d.existingSubs || {};

			if (topic in _d.existingSubs) {
				return false;
			}

			_d.existingSubs[topic] = true;
		}

		return true;
	},

	framePhishCandidates: {},

	framePhishTimerHandler: function() {
		for (var sourceId in this.framePhishCandidates) {
			this.logError("framePhishHandler", "FramePhish attempt detected, sourceId = " + sourceId);
			var source = this.framePhishCandidates[sourceId];

			this.doClientCallback(this.EVENTS.ON_OA_SECURITYALERT, source, OpenAjax.hub.SecurityAlert.FramePhish);

			// delete the app
			delete this.activeAppInstances[sourceId];
			delete this.framePhishCandidates[sourceId];

			try {
				source.remove();
			}
			catch (ex) {
				this.logWarning("framePhishTimerHandler", "source.remove() failed for " + sourceId, ex);
			}
		}
	},

	startFramePhishTimer: function(clientId, source) {
		this.framePhishCandidates[clientId] = source;
		window.setTimeout($.proxy(this.framePhishTimerHandler, this), this.appLoadTimeout);
	},

	cancelFramePhishCheck: function(sourceId) {
		delete this.framePhishCandidates[sourceId];
	},

	onOASecurityAlert: function(source, alertType) {
		var appInstance = this.activeAppInstances[source.getClientID()];

		// For FramePhish errors, we give the app a few seconds to reconnect before calling it an error
		if (alertType == OpenAjax.hub.SecurityAlert.FramePhish) {
			this.startFramePhishTimer(source.getClientID(), source);
			return;
		}

		this.logError("onOASecurityAlert", "source: " + source.getClientID() + ", alertType = " + alertType);

		this.doClientCallback(this.EVENTS.ON_OA_SECURITYALERT, source, alertType);

		if (alertType == OpenAjax.hub.SecurityAlert.LoadTimeout) {
			this.logError("onOASecurityAlert", "App failed to load in time, url = " + (appInstance ? appInstance.url : "(unknown"));
			delete this.activeAppInstances[source.getClientID()];
			source.remove();
		}

		return true;
	},

	onOAConnect: function(container) {
		var sourceId = container.getClientID();
		this.cancelFramePhishCheck(sourceId);

		this.logInfo("onOAConnect", "App connected " + sourceId);
		this.setAppDefaultMessagePolicies(container.getPartnerOrigin());
		return true;
	},

	onOADisconnect: function(container) {
		this.logInfo("onOADisconnect", "App disconnected " + container.getClientID());
		//TODO: Not entirely sure this is the right thing to do here.
		try {
			var iframe = container.getIframe();
			$(iframe).remove();
		}
		catch (ex) {
			this.logError("onOADisconnect", "Error removing iframe: " & this.formatExceptionMessage(ex), ex);
		}
		return true;
	},

	// TODO: how best to get the full URL at runtime
	tunnelURL: null,

	initHub: function() {
		var managedHubParams = {
			scope: this,
			onPublish: this.onOAPublish,
			onSubscribe: this.onOASubscribe,
			onSecurityAlert: this.onOASecurityAlert,
			OpenAjax: {
				policy: this.hubPolicy
			}
		};

		this.managedHub = new OpenAjax.hub.ManagedHub(managedHubParams);
		this.createContainerClient();
	},

	createIframeContainer: function($parentElement, appManifest, iframeAttributes) {
		var params = {
			Container: {
				scope: this,
				onSecurityAlert: this.onOASecurityAlert,
				onConnect: this.onOAConnect,
				onDisconnect: this.onOADisconnect
			},
			IframeContainer: {
				parent: $parentElement[0],
				iframeAttrs: iframeAttributes,
				uri: appManifest.url,
				tunnelURI: this.tunnelURL,
				timeout: this.appLoadTimeout
			}
		};

		var container = new OpenAjax.hub.IframeContainer(this.managedHub, appManifest.appInstanceId, params);
		return container;
	},

	createContainerClient: function() {
		this.setContainerDefaultMessagePolicies();

		var params = {
			managedHub: this.managedHub,
			onSecurityAlert: $.proxy(this.onOASecurityAlert, this),
			appInstanceId: 'appstore.container'
		};

		this.inlineHubClient = this.createInlineClient(params);
		this.inlineHubContainer = params.inlineContainer;

		this.inlineHubClient.connect($.proxy(this.onOAConnect, this));
		// currently just subscribing to app messages
		this.inlineHubClient.subscribe(AppStore.Constants.TOPIC.FROM_APP.ALL, this.onOpenAjaxMessage, this, null);
	},

	// this is messy, I'm not sure if the caller needs to keep the container around or whether they only need a reference to the client
	// also, this is specific to the OpenAjax implementation, how can we abstract it so that we can plug in another transport?

	createInlineClient: function(params) {
		var containerParams = {
			Container: {
				onSecurityAlert: params.onSecurityAlert
			},

			InlineContainer: {}
		};

		params.inlineContainer = new OpenAjax.hub.InlineContainer(params.managedHub, params.appInstanceId, containerParams);

		var clientParams = {
			HubClient: {
				onSecurityAlert: params.onSecurityAlert
			},
			InlineHubClient: {
				container: params.inlineContainer
			}
		};

		params.inlineHubClient = new OpenAjax.hub.InlineHubClient(clientParams);
		return params.inlineHubClient;
	},


	//------------------------------------
	// Messaging
	//------------------------------------

	createAppMessage: function(appInstanceId, payload) {
		// add any additional out-of-band header stuff here
		var message = {
			appInstanceId: appInstanceId,
			payload: payload
		};

		return message;
	},

	publish: function(topic, appInstanceId, payload) {
		var message = this.createAppMessage(appInstanceId, payload);
		try {
			this.inlineHubClient.publish(topic, message);
		}
		catch (ex) {
			this.logCritical("publish", "topic = " + topic + ", payload = " + JSON.stringify(payload), ex);
		}
	},

	onOpenAjaxMessage: function(topic, message, subscriberData) {
		// do NOT throw an unhandled error here or the lights go out
		try {
			var payload = message.payload;
			var appInstanceId = message.appInstanceId;

			if (!appInstanceId) {
				this.logError('onOpenAjaxMessage', 'Message received from unknown app (' + message.appInstanceId + '): topic = \'' + topic + '\'');  // TODO: add dump of message here (can't find jQuery dump plugin)
				return;
			}

			// attach the relevant appInstance to the message

			message.appInstance = this.activeAppInstances[appInstanceId];

			this.logVerbose("onOpenAjaxMessage", "Message received, topic = '" + topic + "', app = '" + message.appInstance.appDescriptor.toString() + "'");

			// see if there is a handler defined
			var handler = this.messageHandlers[topic];

			if (handler) {
				handler.apply(this, arguments);
			}
			else {
				// deal with special cases
				switch (topic) {
					default:
						this.logError('Invalid message received: topc = \'' + topic + '\'');  // TODO: add dump of message here (can't find jQuery dump plugin)
						break;
				}
			}
		}
		catch (ex) {
			this.logError('onOpenAjaxMessage', 'Topic = \'' + topic + '\'\n' + this.formatExceptionMessage(ex), ex);
		}
	},


	//------------------------------------
	// client callbacks
	//------------------------------------

	clientCallbacks: {},

	doClientCallback: function(eventName) {
		var retVal = null;

		try {
			var callback = this.clientCallbacks[eventName];

			if (callback) {
				// strip out eventName, add in callback data
				[ ].splice.apply(arguments, [0, 1]);
				[ ].push.apply(arguments, [callback.data]);
				retVal = callback.fn.apply(callback.scope, arguments);
			}
		}
		catch (ex) {
			this.logError("doClientCallback[" + eventName + "]", "Error in callback: " + this.formatExceptionMessage(ex), ex);
		}

		return retVal;
	},

	bind: function(eventName, fn, scope, data) {
		this.clientCallbacks[eventName] = {
			fn: fn,
			scope: scope,
			data: data
		};
	},

	//------------------------------------
	// internal message handlers
	//------------------------------------

	onGetLaunchData: function(topic, message, subscriberdata) {
		this.sendAppLaunchData(message.appInstanceId);
	},

	onGetAppContext: function(topic, message, subscriberdata) {
		this.sendAppContext(message.appInstanceId);
	},

	onAppLaunch: function(topic, message, subscriberdata) {
		var parentAppInstance = this.activeAppInstances[message.appInstanceId];

		// check if the binding needs to be resolved

		var endPointId = message.payload.endPointId;
		var bindings = this.resolveAppBinding(parentAppInstance, endPointId);
		var binding = null;

		if (bindings.length == 1) {
			binding = bindings[0];
		}
		else if (bindings.length > 1) {
			// ask the container app to resolve the binding
			binding = this.doClientCallback(this.EVENTS.ON_RESOLVE_APP_BINDING, parentAppInstance.manifest, endPointId, bindings);
		}

		if (!binding) {
			this.logError("onLaunchApp", "App binding not resolved, parentAppInstanceId = " + parentAppInstance.appInstanceId + ", endPointId = " + endPointId);
		}
		else {
			// request a display element to put it in

			var $element = this.doClientCallback(this.EVENTS.ON_GET_APP_DISPLAY_CONTAINER, { appInstance: parentAppInstance, launchMode: message.payload.launchMode, flags: message.payload.flags, binding: binding });

			if (!$element) {
				if ($element !== false) {
					this.logError("onLaunchApp", "No display element, parentAppInstanceId = " + parentAppInstance.appInstanceId + ", endPointId = " + endPointId);
				}
			}
			else {
				// good to go, fire her up
				// TODO: should we send a message back to the requesting app to say that the new app has been created?
				// Apps can only launch other apps using their own context,  
				// TODO: validate that this restriction is necessary, since this requires that an app can only launch other app interfaces that have the same context

				var context = parentAppInstance ? parentAppInstance.context : null;
				this.createAppFromDescriptor(binding.appDescriptor, parentAppInstance, context, $element, null, message.payload.params, binding.invokedInterfaceId);
			}
		}
	},

	onAppReady: function(topic, message, subscriberdata) {
		var appInstance = this.activeAppInstances[message.appInstanceId];

		if (appInstance) {
			this.doClientCallback(this.EVENTS.ON_APP_READY, { appInstance: appInstance });
		}
	},

	onAppClose: function(topic, message, subscriberdata) {
		var appInstance = this.activeAppInstances[message.appInstanceId];

		if (appInstance) {
			this.closeApp(appInstance, message.payload.returnValue);
		}
	},

	updateAppInstanceContext: function(appInstance, newContext) {
		// TODO: this should possibly check the manifest for the apps declared context and only copy in the bits that are relevant
		appInstance.context = newContext;
	},

	onContextUpdate: function(topic, message, subscriberdata) {
		var appInstance = this.activeAppInstances[message.appInstanceId];
		var newContext = new AppStore.Context(message.payload.context._elements);

		this.logInfo("onContextUpdate", "Context publish request from " + appInstance.appDescriptor.toString() + ", context = " + newContext.toString());

		if (appInstance) {
			var prevContext = appInstance.context;
			this.updateAppInstanceContext(appInstance, newContext);
			this.doClientCallback(this.EVENTS.ON_CONTEXT_CHANGE, appInstance, newContext, prevContext);
		}
	},

	//------------------------------------
	// container services
	//------------------------------------

	checkAppServiceAccess: function(appInstance, serviceId) {

		// check permissions
		// if this app is allowed to call this service then it would have been resolved at startup

		var isAllowed = false;

		for (var idxInvokes = 0; idxInvokes < appInstance.manifest.bindings.data.length; idxInvokes++) {
			var invokes = appInstance.manifest.bindings.data[idxInvokes];

			// TODO: versioning of container interfaces

			if (invokes.interfaceId == serviceId) {
				isAllowed = true;
				break;
			}
		}

		if (!isAllowed) {
			this.publish(AppStore.Constants.TOPIC.FROM_CONTAINER.ERROR, appInstance.appInstanceId, new AppStore.Error(5, "Access denied to service " + serviceId));
			return;
		}

		return isAllowed;
	},

	onContainerServiceRequest: function(topic, message, subscriberdata) {
		var appInstance = this.activeAppInstances[message.appInstanceId];
		var svcDef = this.findContainerServiceDefinitionByTopic(topic);

		if (!svcDef) {
			this.logError("onContainerServiceRequest", "Unknown container service request, topic = " + topic + ", appInstanceId = " + message.appInstanceId);
			this.publish(AppStore.Constants.TOPIC.FROM_CONTAINER.ERROR, appInstance.appInstanceId, new AppStore.Error(5, "Service not implemented - " + topic));
			return;
		}

		if (!(appInstance && this.checkAppServiceAccess(appInstance, svcDef.serviceId))) {
			return;
		}

		var handler = this.containerServiceHandlers[svcDef.serviceId];

		try {
			handler.apply(this, arguments);
		}
		catch (ex) {
			this.logError("onContainerServiceRequest", "Error in container service handler, topic = " + topic, ex);
		}
	},

	onAppSearch: function(topic, message, subscriberdata) {
		var params = $.extend({
			publisherId: null,
			appId: null,
			appName: null,
			version: null,
			offset: 0,
			maxResults: 6
		}, message.payload.params);

		var appInstance = this.activeAppInstances[message.appInstanceId];
		var manifests = [];
		var appNameRegEx = params.appName ? new RegExp(".*" + params.appName + ".*", "ig") : null;
		var idxManifest;

		for (idxManifest = 0; idxManifest < this.config.appManifests.length; idxManifest++) {
			var manifest = this.config.appManifests[idxManifest];

			if ((!params.publisherId || params.publisherId == manifest.publisherId)
				&& (!params.appId || params.appId == manifest.appId)
				&& (!appNameRegEx || appNameRegEx.test(manifest.appName))
				&& this.versionsMatch(params.version, manifest.version)) {

				var newManifest = $.extend(true, {}, manifest);
				manifests.push(newManifest);
			}
		}

		var results = [];

		for (idxManifest = params.offset, resultCount = 0; idxManifest < manifests.length && (params.maxResults <= 0 || resultCount < params.maxResults); idxManifest++, resultCount++) {
			results.push(manifests[idxManifest]);
		}

		var payload = {
			Apps: results,
			Count: manifests.length,
			Start: params.offset
		};

		this.publish(AppStore.Constants.TOPIC.FROM_CONTAINER.APP_SEARCH_RESULTS, message.appInstanceId, payload);
	},

	onAppVersionInfo: function(topic, message, subscriberData) {

	},

	messageHandlers: {},
	containerServiceHandlers: {},

	findContainerServiceDefinitionByTopic: function(topic) {
		for (var svcKey in this.CONTAINER_SERVICES) {
			var svcDef = this.CONTAINER_SERVICES[svcKey];
			if (svcDef.topic == topic) {
				return svcDef;
			}
		}

		return null;
	},

	// Security

	onRefreshAppToken: function(topic, message, subscriberdata) {
		this.doClientCallback(this.EVENTS.ON_STATUS_MESSAGE, "Refreshing App Token");
	},

	onRefreshContainerToken: function(topic, message, subscriberdata) {
		alert("container token refresh called");
	},

	onStepup: function(topic, message, subscriberdata) {
		alert("steup called");
	},

	onReAuthenticate: function(topic, message, subscriberdata) {
		alert("reauthenticate called");
	},

	onSignout: function(topic, message, subscriberdata) {
		alert("signout called");
	},


	// this maps message topics to container service ids
	topicToServiceIdMap: {},

	initMessageHandlers: function() {
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.LAUNCH_DATA_GET] = this.onGetLaunchData;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.CONTEXT_GET] = this.onGetAppContext;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.APP_LAUNCH] = this.onAppLaunch;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.APP_CLOSE] = this.onAppClose;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.APP_READY] = this.onAppReady;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.APP_SEARCH] = this.onAppSearch;
		this.messageHandlers[AppStore.Constants.TOPIC.FROM_APP.CONTEXT_UPDATE] = this.onContextUpdate;

		// wire up the container services
		for (var svcKey in this.CONTAINER_SERVICES) {
			var svcDef = this.CONTAINER_SERVICES[svcKey];
			this.topicToServiceIdMap[svcDef.topic] = svcDef.serviceId;
			this.messageHandlers[svcDef.topic] = this.onContainerServiceRequest;

			// unfortunately there doesn't seem to be a way to satically declare the handler methods in the CONTAINER_SERVICES array
			// so we have to wire them up manually

			switch (svcDef.topic) {
				case AppStore.Constants.TOPIC.FROM_APP.APP_SEARCH:
					this.containerServiceHandlers[svcDef.serviceId] = this.onAppSearch;
					break;

				case AppStore.Constants.TOPIC.FROM_APP.APP_VERSION_INFO:
					this.containerServiceHandlers[svcDef.serviceId] = this.onAppVersionInfo;
					break;
			}
		}
	},

	CONTAINER_SERVICES: [
		{
			serviceId: "AppSearch",
			topic: AppStore.Constants.TOPIC.FROM_APP.APP_SEARCH,
			handler: this.onAppSearch
		},
		{
			serviceId: "AppVersionInfo",
			topic: AppStore.Constants.TOPIC.FROM_APP.APP_VERSION_INFO,
			handler: this.onAppVersionInfo
		}
	],


	//------------------------------------
	// app management
	//------------------------------------

	activeAppInstances: {},

	findDataBinding: function(callerManifest, invokesItem) {
		var dataBinding = null;

		// see if we have a matching app/entryPoint
		var invokeBinding = invokesItem.bindings.Item;

		switch (invokeBinding.__type) {
			case this.INVOKEDATABINDING_TYPES.CONTAINER:
				dataBinding = this.resolveContainerDataBinding(callerManifest, invokeBinding);
				break;

			default:
				// TODO: other bindings not defined yet.
				this.logError("findDataBinding", "Unknown binding type: " + invokeBinding.__type);
				break;
		}

		return dataBinding;
	},


	resolveContainerDataBinding: function(callerManifest, invokeBinding) {

		var dataBinding = null;

		for (idxExposes = 0; idxExposes < this.containerManifest.bindings.exposes.length; idxExposes++) {
			var exposed = this.containerManifest.bindings.exposes[idxExposes];

			if (exposed.interfaceId == invokeBinding.interfaceId && this.versionsMatch(exposed.interfaceVersion, invokeBinding.interfaceVersion)) {
				var hasPermission = false;

				for (var idxPermitted = 0; exposed.permittedConsumers && idxPermitted < exposed.permittedConsumers.length; idxPermitted++) {
					var permitted = exposed.permittedConsumers[idxPermitted];

					if (permitted.__type == this.BINDING_PERMISSIONS.ANY_APP
						|| (permitted.__type == this.BINDING_PERMISSIONS.SPECIFIC_PUBLISHER &&
							permitted.publisherId == callerManifest.publisherId)
						|| (permitted.__type == this.BINDING_PERMISSIONS.SPECIFIC_APP &&
							permitted.publisherId == callerManifest.publisherId
							&& permitted.appId == callerManifest.appId)) {

						hasPermission = true;
						break;
					}
				}

				if (hasPermission) {
					var url = exposed.resolvesTo;

					if (url.indexOf("~/") == 0) {
						url = url.replace("~/", this.basePath);
					}

					dataBinding = {
						interfaceId: invokeBinding.interfaceId,
						interfaceVersion: invokeBinding.interfaceVersion,
						//			serviceEndPoint: "http://localhost/AppStore/Publishers/Universe/ContainerService.asmx"
						serviceEndPoint: url
					};
				}
			}
		}

		// TODO: throw error if not resolved

		return dataBinding;
	},

	findUIBindings: function(callerManifest, invokesItem) {
		var uiBindings = [];

		// see if we have a matching app/entryPoint
		for (var idxBinding = 0; idxBinding < invokesItem.bindings.Items.length; idxBinding++) {
			var invokeBinding = invokesItem.bindings.Items[idxBinding];

			switch (invokeBinding.__type) {
				case this.INVOKEUIBINDING_TYPES.CONTAINER:
					// At the moment this is really just for setting context, so accept all bindings

					var containerBinding = {
						isContainer: true,
						context: new AppStore.Context(),
						interfaceId: invokesItem.interfaceId,
						appDescriptor: this.containerAppDescriptor
					};

					for (var idxParam = 0; idxParam < invokeBinding.parameters.Any.length; idxParam++) {
						var entity = invokeBinding.parameters.Any[idxParam];
						containerBinding.context.addNewContextElement(entity.__namespace, entity.__type, {});
					}

					uiBindings.push(containerBinding);
					break;

				case this.INVOKEUIBINDING_TYPES.APP:
					var bindingAppDescriptor = new AppStore.AppDescriptor(invokeBinding.publisherId, invokeBinding.appId, "*");  // binding has interfaceVersion, not app version
					var destManifest = this.findAppManifestByAppDescriptor(bindingAppDescriptor);

					if (destManifest) {

						if (!destManifest.bindings) {
							this.resolveManifestBindings(destManifest);
						}

						if (!destManifest.hasUnresolvedBindings) {
							// find the entryPoint

							for (idxExposes = 0; idxExposes < destManifest.bindings.exposes.length; idxExposes++) {
								var exposes = destManifest.bindings.exposes[idxExposes];

								if (exposes.interfaceId == invokeBinding.interfaceId && this.versionsMatch(exposes.interfaceVersion, invokeBinding.interfaceVersion)) {
									for (var idxPermitted = 0; idxPermitted < exposes.permittedConsumers.length; idxPermitted++) {
										var permitted = exposes.permittedConsumers[idxPermitted];

										// TODO: test all these combinations
										if ((permitted.__type == this.BINDING_PERMISSIONS.ANY_APP)
											|| (permitted.__type == this.BINDING_PERMISSIONS.SPECIFIC_APP
													&& permitted.publisherId == appDescriptor.publisherId
													&& permitted.appId == appDescriptor.appId
													&& this.versionsMatch(permitted.appVersion, appDescriptor.version))
										) {
											uiBindings.push({
												interfaceId: invokesItem.interfaceId,
												invokedInterfaceId: invokeBinding.interfaceId,
												resolvesTo: exposes.resolvesTo,
												appDescriptor: bindingAppDescriptor
											});
										}
									}
								}
							}
						}
					}
					break;

				default:
					this.logError("findUIBindings", "Unknown binding type: " + invokeBinding.__type);
					break;
			}
		}

		return uiBindings.length > 0 ? uiBindings : null;
	},


	resolveManifestBindings: function(callerManifest) {

		/// <description>Creates a more easily manageable representation of the bindings for an app, including resolving endpoints</description>

		// avoid circular references
		if (callerManifest.bindings) {
			return;
		}

		callerManifest.appDescriptor = new AppStore.AppDescriptor(callerManifest.publisherId, callerManifest.appId, callerManifest.version);

		this.logVerbose("resolveManifestBindings", "App - " + callerManifest.appDescriptor.toString());

		callerManifest.bindings = {
			data: [],
			ui: [],
			exposes: []
		};

		//		var callerManifest = this.findAppManifestByAppDescriptor(appDescriptor);

		// loop through the exposed endpoints for this app
		for (var idxExposes = 0; callerManifest.exposes && idxExposes < callerManifest.exposes.Items.length; idxExposes++) {
			var exposesItem = callerManifest.exposes.Items[idxExposes];

			var exposed = {
				interfaceId: exposesItem.interfaceId,
				interfaceVersion: exposesItem.interfaceVersion,
				resolvesTo: exposesItem.resolvesTo,
				permitted: [],
				context: new AppStore.Context()
			};

			exposed.permittedConsumers = exposesItem.permittedConsumers;

			for (var idxParam = 0; exposesItem.parameters && exposesItem.parameters.Any && idxParam < exposesItem.parameters.Any.length; idxParam++) {
				exposed.context.addNewContextElement(exposesItem.parameters.Any[idxParam].__namespace, exposesItem.parameters.Any[idxParam].__type, {});
			}

			callerManifest.bindings.exposes.push(exposed);
		}

		// loop through the outgoing endpoints for this app
		for (var idxInvokes = 0; callerManifest.invokes && idxInvokes < callerManifest.invokes.Items.length; idxInvokes++) {
			var invokesItem = callerManifest.invokes.Items[idxInvokes];
			var found = false;

			switch (invokesItem.__type) {
				case this.INVOKEBINDING_TYPES.DATA:

					var dataBinding = this.findDataBinding(callerManifest, invokesItem);

					if (dataBinding) {
						callerManifest.bindings.data.push(dataBinding);
						found = true;
					}
					else {
						this.logWarning("resolveManifestBindings", "Unresolved data binding, app = " + callerManifest.appDescriptor.toString() + ", interface = " + invokesItem.interfaceId);
					}
					break;

				case this.INVOKEBINDING_TYPES.UI:

					var uiBindings = this.findUIBindings(callerManifest, invokesItem);

					// TODO: recurse through to weed out any unresolved bindings

					if (uiBindings) {
						callerManifest.bindings.ui = callerManifest.bindings.ui.concat(uiBindings);

						if (uiBindings.length > 0) {
							found = true;
						}
						else {
							this.logWarning("resolveManifestBindings", "Unresolved UI binding, app = " + callerManifest.appDescriptor.toString() + ", interface = " + invokesItem.interfaceId);
						}
					}
					break;

				default:
					this.logError("resolveManifestBindings", "Unknown binding type: " + invokes.__type);
					break;
			}

			if (invokesItem.use == this.INVOKES_MODE.MANDATORY && !found) {
				callerManifest.hasUnresolvedBindings = true;
			}
		}

		return;
	},


	resolveAppBinding: function(appInstance, interfaceId) {
		var found = false;
		var bindings = new Array();

		for (var idxBinding = 0; idxBinding < appInstance.manifest.bindings.ui.length; idxBinding++) {
			var binding = appInstance.manifest.bindings.ui[idxBinding];

			if (binding.interfaceId == interfaceId) {
				bindings.push(binding);
			}
		}

		return bindings;
	},

	// app context
	// TODO: lots

	onLaunchDataCallback: function(data) {

	},

	sendAppLaunchData: function(appInstanceId) {
		var appInstance = this.activeAppInstances[appInstanceId];
		var user = this.user;
		var context = appInstance.context;
		var manifest = appInstance.manifest;
		var bindings = manifest.bindings;
		var dataSources = AppStore.dataSources;  // TODO: filter this list to only pass the ones the app has declared
		var themes = appInstance.manifest.themes;
		if (themes) {
			themes.containerPath = this.basePath;
			themes.containerTheme = this.containerTheme;
		}

		// TODO: remove appDescriptor and other info from the version returned to the app
		//var appBindings = $.extend(true, {}, bindings);
		//this.cleanAppBindings(appBindings);

		var launchMessage = {
			user: user,
			context: context,
			manifest: manifest,
			bindings: bindings,
			dataSources: dataSources,
			params: appInstance.params,
			themes: themes
		};

		this.logVerbose("sendAppLaunchData", "App - " + appInstance.appDescriptor.toString() + ", context - " + launchMessage.context.toString() + ", params = " + JSON.stringify(launchMessage.params));

		this.publish(AppStore.Constants.TOPIC.FROM_CONTAINER.LAUNCH_DATA_SET, appInstanceId, launchMessage);
	},

	sendAppContext: function(appInstance) {
		var context = appInstance.context;

		var contextMessage = {
			context: context
		};

		this.logVerbose("sendAppContext", "App - " + appInstance.appDescriptor.toString() + ", data - " + JSON.stringify(contextMessage));

		this.publish(AppStore.Constants.TOPIC.FROM_CONTAINER.CONTEXT_SET, appInstance.appInstanceId, contextMessage);
	},

	setAppContext: function(appInstance, context) {

		appInstance.context = context || new AppStore.Context();
		return appInstance.context;
	},

	getManifestByAppDescriptor: function(appDescriptor) {
		var found = false;
		var manifest;

		for (var key in this.config.appManifests) {
			manifest = this.config.appManifests[key];

			if (manifest.publisherId == appDescriptor.publisherId && manifest.appId == appDescriptor.appId
				&& (appDescriptor.version == "*" || appDescriptor.version == manifest.version)) {
				found = true;
				break;
			}
		}

		return found ? manifest : null;
	},

	versionsMatch: function(v1, v2) {
		var isMatch = false;
		var stripV = /^(v)/i;

		var _v1 = v1 || "*";
		var _v2 = v2 || "*";

		// ignore any "v" at the start	
		_v1 = _v1.replace(stripV, "");
		_v2 = _v2.replace(stripV, "");

		if (_v1 == '*' || _v2 == '*') {
			isMatch = true;
		}
		else {
			if (_v1 == _v2) {
				isMatch = true;
			}
			else {
				var v1Parts = _v1.split(".");
				var v2Parts = _v2.split(".");

				var maxIdx = Math.max(v1Parts.length, v2Parts.length);

				// fill in any additional sub-versions with zeros

				if (v1Parts.length < maxIdx) {
					for (var idxV1 = v1Parts.length; idxV1 < maxIdx; idxV1++) {
						v1Parts[idxV1] = "0";
					}
				}

				if (v2Parts.length < maxIdx) {
					for (var idxV2 = v2Parts.length; idxV2 < maxIdx; idxV2++) {
						v2Parts[idxV2] = "0";
					}
				}

				var matches = 0;

				for (var idxPart = 0; idxPart < maxIdx && !isMatch; idxPart++) {
					// if we've got this far and hit a wildcard then we're done
					if (v1Parts[idxPart] == "*" || v2Parts[idxPart] == "*") {
						isMatch = true;
					}
					else {
						if (v1Parts[idxPart] == v2Parts[idxPart]) {
							matches++;
						}
						else {
							break;
						}
					}
				}

				if (matches == maxIdx) {
					isMatch = true;
				}
			}
		}

		return isMatch;
	},

	findAppManifestByAppDescriptor: function(appDescriptor) {
		var appManifests = new Array();

		for (idx in this.config.appManifests) {
			var am = this.config.appManifests[idx];
			if (am.publisherId == appDescriptor.publisherId && am.appId == appDescriptor.appId && this.versionsMatch(appDescriptor.version, am.version)) {
				appManifests.push(am);
			}
		}

		// TODO: find the latest one of there are more than one

		return appManifests.length > 0 ? appManifests[0] : null;
	},

	createAppFromDescriptor: function(appDescriptor, parentAppInstance, context, $dest, iframeAttrs, appParams, interfaceId, interfaceVersion) {
		// TODO: not sure what to do if no manifest matches
		var manifest = this.findAppManifestByAppDescriptor(appDescriptor);
		var appInstance = null;

		if (manifest) {
			appInstance = this.createAppFromManifest(manifest, parentAppInstance, context, $dest, iframeAttrs, appParams, interfaceId, interfaceVersion);
		}
		else {
			this.logError("createAppFromDescriptor", "Manifest not found for app " + appDescriptor.toString());
		}

		return appInstance;
	},

	createAppFromManifest: function(appManifest, parentAppInstance, context, $dest, iframeAttrs, appParams, interfaceId, interfaceVersion) {
		// this is equivalent to inheriting from the manifest, so all the manifest properties 
		// become properties of the app instance
		var appInstance = {};
		$().extend(true, appInstance, appManifest);

		appInstance.appInstanceId = appInstance.publisherId + '.' + appInstance.appId + '_v' + appInstance.version + "_" + this.generateId();

		// we also keep a reference to the original manifest so that we can send it to the app as part of its initial context

		appInstance.manifest = appManifest;
		appInstance.params = appParams || {};
		appInstance.parentAppInstance = parentAppInstance;

		// find the correct URL

		var url = null;

		for (var idxExposes = 0; appManifest.exposes && idxExposes < appManifest.exposes.Items.length && !url; idxExposes++) {
			var exposes = appManifest.exposes.Items[idxExposes];

			// if interfaceId is supplied then it's a point-to-point, otherwise any interfaceId will do

			if (!interfaceId ||
				(interfaceId == exposes.interfaceId && (!interfaceVersion || interfaceVersion == "*" || interfaceVersion == exposes.interfaceVersion))) {
				for (var idxPermitted = 0; idxPermitted < exposes.permittedConsumers.length && !url; idxPermitted++) {
					var permitted = exposes.permittedConsumers[idxPermitted];

					// TODO: test all these combinations						
					if ((permitted.__type == this.BINDING_PERMISSIONS.ANY_APP || permitted.__type == this.BINDING_PERMISSIONS.ANY_CONTAINER)
						|| (parentAppInstance
							&& permitted.__type == this.BINDING_PERMISSIONS.SPECIFIC_APP
							&& permitted.publisherId == parentAppInstance.publisherId
							&& permitted.appId == parentAppInstance.appId
							&& this.versionsMatch(permitted.appVersion))
					) {
						url = exposes.resolvesTo;
					}
				}
			}
		}

		if (url && url.indexOf("~/") === 0) {
			url = url.replace("~/", "");
		}

		if (!url) {
			var errMsg = "Can't find launch URL (resolvesTo), app = " + appInstance.appDescriptor.fqId;
			this.logError("createAppFromManifest", errMsg);
			throw new Error(errMsg);
		}

		var appAuthToken = null;
		var appNamespace = appManifest.appId + '.' + appManifest.version;

		// For each app - we produce a signed token for that app
		// The app authentication modules will only accept a token that matches its namespace
		$.postJSON('Ajax/Apps.aspx/GetAuthTokenForApp', { appId: appNamespace }, { async: false })
			.success(function(token) { appAuthToken = token; })
			.error($.proxy(this.onAuthTokenLoadFailure, this));

		appInstance.url = (url.toLowerCase().indexOf('http') === 0) ? url : 'Apps/' + appInstance.appDescriptor.fqId + "/" + url;
		appInstance.url += "?tok=" + appAuthToken;

		// this really shouldn't be here
		var appIframeAttrs = $.extend({
			'border': '0',
			'frameborder': '0',
			'marginheight': '0',
			'marginwidth': '0',
			'width': '100%',
			'height': '100%',
			'scrolling': 'auto'
		}, iframeAttrs);

		appIframeAttrs.id = appInstance.appInstanceId;
		appIframeAttrs.name = appInstance.appInstanceId;

		// TODO: create the correct context for the new app e.g. if it's being launched by an existing app then
		// there may be some of that app's context that we need to preserve

		this.setAppContext(appInstance, context);

		this.logInfo("createAppFromManifest", "Launching app " + appInstance.appDescriptor.toString()) + "...";
		appInstance.container = this.createIframeContainer($dest, appInstance, appIframeAttrs);
		appInstance.$iframe = $(appInstance.container.getIframe());
		appInstance.$iframe[0].originalSrc = appInstance.container.getIframe().src;
		appInstance.$iframe.on({
			load: function() {
				this.contentWindow.postMessage({ mt: "appstore.message", mst: "originalSrc", originalSrc: this.originalSrc }, "*");
			}
		});

		this.activeAppInstances[appInstance.appInstanceId] = appInstance;
		this.doClientCallback(this.EVENTS.ON_APP_LAUNCHED, appInstance);
		return appInstance;
	},

	forceAppClose: function(appInstance, returnValue) {

		this.logInfo("forceAppClose", "Forcing app close - " + appInstance.appDescriptor.toString());

		try {
			if (appInstance.container.isConnected()) {
				this.managedHub.removeContainer(appInstance.container);
			}
		}
		catch (ex) {
		}

		return this.closeApp(appInstance, returnValue);
	},

	closeApp: function(appInstance, returnValue) {
		this.logInfo("closeApp", "App closed - " + appInstance.appDescriptor.toString());
		this.doClientCallback(this.EVENTS.ON_APP_CLOSE, appInstance, returnValue);
		delete this.activeAppInstances[appInstance.appInstanceId];
	},

	//-----------------------------------
	// Security
	//-----------------------------------
	securitySessionContext: {

		secureSignIn: function(token) {
			// todo
			alert("Signed in");
		}
	},

	onAuthTokenLoadFailure: function(returnContext) {

		// We could not generate an app token
		// Most likely cause is session has expired...
		if (returnContext.status == 403) {
			// Check for the container refresh demand
			if (returnContext.getResponseHeader("X-Refresh-Token-Demand") == "*") {
				// The following will invoke the server-side authentication process
				// This may be different for each container - so let it handle it...
				window.location.reload();
			}
		}
		else {
			// TODO: what's this??
		}
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

	debugMinLevel: 1,

	debugSource: 'ContainerBase',

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
					window.console.log(ex);
				}
			}
		}

		for (var idx = 0; idx < this.loggers.length; idx++) {
			var logger = this.loggers[idx];

			if (level >= logger.minLevel) {
				try {
					logger.fn.call(logger.scope, level, source, method, text, ex);
				}
				catch (ex) {
					window.console.log(ex);
				}
			}
		}
	},

	formatExceptionMessage: function(ex) {
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

	loggers: [],

	registerLogger: function(scope, minLevel, fn) {
		var logger = {
			scope: scope,
			fn: fn,
			minLevel: minLevel,
			id: this.generateId()
		};

		this.loggers.push(logger);
		return logger;
	},

	//-----------------------------------
	// configuration
	//-----------------------------------

	loadConfig: function() {

		this.logInfo("loadConfig", "Initialising...");

		this.config = window.AppStore.ContainerConfiguration || {};

		this.createRendezvous(this.LOAD_RENDEZVOUSID,
			[
				this.SEMAPHORES.GET_CONTAINER_MANIFEST,
				this.SEMAPHORES.GET_MANIFESTS,
				this.SEMAPHORES.GET_IDENTITY
			],
			$.proxy(this.initPhase2, this)
		);

		this.logInfo("loadConfig", "Get container manifest");

		// get the container manifest
		$.postJSON('Ajax/Apps.aspx/GetContainerManifest', {})
			.success($.proxy(this.onContainerManifestLoaded, this))
			.error($.proxy(this.onContainerManifestFailure, this));

		this.logInfo("loadConfig", "Get app manifests");

		// get the app manifests
		$.postJSON('Ajax/Apps.aspx/GetManifests', {})
			.success($.proxy(this.onGetManifestsLoaded, this))
			.error($.proxy(this.onGetManifestsLoadFailure, this));

		this.logInfo("loadConfig", "Get user identity");

		// get the user identity
		$.postJSON('Ajax/Apps.aspx/GetContainerIdentity', {})
			.success($.proxy(this.onGetContainerIdentityLoaded, this))
			.error($.proxy(this.onGetContainerIdentityFailure, this));
	},

	onContainerManifestFailure: function(jqXHR, textStatus, errorThrown) {
		alert("Ajax error: " + textStatus);
		this.checkRendezvous(this.LOAD_RENDEZVOUSID, this.SEMAPHORES.GET_CONTAINER_MANIFEST);
	},

	onContainerManifestLoaded: function(data) {
		this.logInfo("onContainerManifestLoaded", "Container manifest loaded");
		this.containerManifest = data.app;
		this.checkRendezvous(this.LOAD_RENDEZVOUSID, this.SEMAPHORES.GET_CONTAINER_MANIFEST);
	},

	onGetManifestsLoadFailure: function(jqXHR, textStatus, errorThrown) {
		alert("Ajax error: " + textStatus);
		this.checkRendezvous(this.LOAD_RENDEZVOUSID, this.SEMAPHORES.GET_MANIFESTS);
	},

	onGetManifestsLoaded: function(data) {
		this.logInfo("onGetManifestsLoaded", "App manifests loaded");
		this.config.appManifests = data;
		this.checkRendezvous(this.LOAD_RENDEZVOUSID, this.SEMAPHORES.GET_MANIFESTS);
	},

	onGetContainerIdentityFailure: function(jqXHR, textStatus, errorThrown) {
		alert("Ajax error: " + textStatus);
		this.checkRendezvous(this.LOAD_RENDEZVOUSID, this.SEMAPHORES.GET_IDENTITY);
	},

	onGetContainerIdentityLoaded: function(data) {
		this.logInfo("onGetContainerIdentityLoaded", "Identity loaded");
		window.AppStore.Container.identity = jQuery.parseJSON(data);
		this.checkRendezvous(this.LOAD_RENDEZVOUSID, this.SEMAPHORES.GET_IDENTITY);
	},

	// a generic mechanism for calling multiple asynchronous services and not continuing until all have returned

	rendezvousList: {},

	createRendezvous: function(rendezvousId, semaphores, callback, callbackData) {
		var rendezvous = {
			semaphores: {},
			callback: callback,
			callbackData: callbackData
		};

		for (idxSem = 0; idxSem < semaphores.length; idxSem++) {
			rendezvous.semaphores[semaphores[idxSem]] = false;
		}

		this.rendezvousList[rendezvousId] = rendezvous;

		return rendezvous;
	},

	checkRendezvous: function(rendezvousId, semaphore, args) {
		var rendezvous = this.rendezvousList[rendezvousId];

		rendezvous.semaphores[semaphore] = true;

		var allGood = true;

		for (sem in rendezvous.semaphores) {
			allGood = allGood && rendezvous.semaphores[sem];
		}

		if (allGood) {
			rendezvous.callback(rendezvous.callbackData, args);
		}
	},

	//-----------------------------------
	// initialisation
	//-----------------------------------

	// there are a growing number of asynchronous tasks during initialisation, we need to rendevous

	SEMAPHORES: {
		GET_CONTAINER_MANIFEST: "getContainerManifest",
		GET_MANIFESTS: "getManifests",
		GET_IDENTITY: "getIdentity"
	},

	LOAD_RENDEZVOUSID: "init",

	// initialisation continues here after configuration is loaded
	initPhase2: function() {

		this.logInfo("initPhase2", "Resolving manifest bindings...");

		this.containerBindings = this.resolveManifestBindings(this.containerManifest);

		// TODO: for containers with large numbers of apps this should be optimised somehow

		for (var idxManifest = 0; idxManifest < this.config.appManifests.length; idxManifest++) {
			var manifest = this.config.appManifests[idxManifest];
			if (!manifest.bindings) {
				this.resolveManifestBindings(manifest);
			}
		}

		this.logInfo("initPhase2", "Initialising message bus");
		this.initHub();
		this.doClientCallback(this.EVENTS.ON_INIT_COMPLETE, this.initStatus);
	},

	init: function(params) {

		this.logInfo("init", "Initialising container...");

		this.initStatus = AppStore.Constants.ERROR.SUCCESS;

		// find the current runtime environment and adjust paths etc

		var myPath = window.location.pathname;
		var pathParts = myPath.split("/");
		pathParts = pathParts.length > 1 ? pathParts.slice(0, pathParts.length - 1) : [""];
		myPath = (window.location.protocol + "//" + window.location.host + pathParts.join("/")).toLowerCase();

		// TODO: configuration settings.   For now take the path for the container page (the current page)
		// and apply some conventions

		this.basePath = myPath;

		this.logInfo("init", "Container path is " + this.basePath);

		this.tunnelURL = params.tunnelURL || "/Scripts/PageBus/full/tunnel.html";

		if (this.tunnelURL.toLowerCase().indexOf("http") < 0) {
			this.tunnelURL = this.basePath + this.tunnelURL;
		}

		if (params.containerId) {
			this.containerId = params.containerId;
		}

		if (params.containerAppDescriptor) {
			this.containerAppDescriptor = params.containerAppDescriptor;
		}

		if (params.appLoadTimeout) {
			this.appLoadTimeout = params.appLoadTimeout;
		}

		if (params.callbacks) {
			for (eventName in params.callbacks) {
				this.clientCallbacks[eventName] = params.callbacks[eventName];
			}
		}

		this.initMessageHandlers();
		this.loadConfig();
	}
};
