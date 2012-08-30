///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Common.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Ajax.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Container.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\jquery-1.7.2-vsdoc.js" />

$(function() {

	var container = AppStore.Container;
	var currentAppInstance = null;
	var contextStack = [];
	var contextDepth = -1;
	var htmlMode = false;
	var myContainerId = "Developer.Container";

	function getCurrentContext() {
		return contextDepth >= 0 ? contextStack[contextDepth] : null;
	}

	function setCurrentContext(context) {
		if (contextDepth < 0) {
			pushContext(context);
		}
		else {
			contextStack[contextDepth] = context;
		}
	}

	function pushContext(context) {
		contextStack[++contextDepth] = context;
	}


	// Unsigned identity token - do not modify
	var userId = '12345678';
	var identityInfo = '{"typ":"JWT","alg":"RS256","x5t":"0XGQ3VOUqmmi6-bgGxhShRrqGhg"}{"UserType":"urn:*","LOA":"urn:password","actortoken":"' + userId + '","aud":"*","nbf":1343954736.099009,"identityprovider":"AppStore_IDP","iss":"CBA.Developer.v1","exp":1501721136.7864783}';

	var settings = $.extend({
		device: 'phone',
		orientation: 'landscape',
		zoom: '100',
		instrumentation: 'off',
		location: 'http://localhost/AppStore/Apps/CBA.CommBank.Customer.TransactionHistory.v1.0.0/Default.htm',
		publisherId: 'CBA',
		appId: 'CommBank.Touch.Home',
		version: '1.0.0',
		traceLevel: 1,
		save: function() {
			localStorage.settings = JSON.stringify(this);
		}
	}, $.parseJSON(localStorage.settings || '{}'));

	settings.containerTheme = settings.containerTheme || "BankWest";
	$("#theme").val(settings.containerTheme);
	$("#tabs").tabs();
	$("#traceLevel").val(settings.traceLevel);

	var app;
	var methods = {
		consoleRefresh: function() {
			$('#instrumentation')[0].contentDocument.location.reload(true);
		},
		consoleClear: function() {
			$.postJSON('Instrumentation.aspx/ClearLog', { app: app })
				.success(function(data) { methods.consoleRefresh(); });
		}
	};

	function applySetting(select) {
		var setting = select.parent().attr('id');
		select.addClass('selected').siblings().removeClass('selected');
		$('#body')
			.removeClass(function(i, css) {
				return (css.match(setting + '-\\S+') || []).join(' ');
			})
			.addClass(setting + '-' + select.attr('data-class'));
	}
	$('#head .setting li[data-class]')
		.click(function(e) {
			var select = $(this);
			settings[select.parent().attr('id')] = select.attr('data-class');
			settings.save();
			applySetting(select);
		})
	.each(function(i, el) {
		var select = $(el);
		if (settings[select.parent().attr('id')] === select.attr('data-class')) {
			applySetting(select);
		}
	});
	$('#head .setting li[data-method]')
		.click(function(e) {
			var select = $(this);
			var func = methods[select.attr('data-method')];
			func();
		});

	$('#home').click(function(e) {
		//$('#app')[0].contentDocument.location.reload(true);
		loadApp();
	});


	//-----------------------------------
	// container callbacks
	//-----------------------------------

	var environmentDefinition;
	var manifestList = [];
	var containerManifest;

	function loadManifests(url) {
		var app;
		var apps = [];
		var verb = "GET";
		var params = {};
		var soapHeader = {};
		var hostInfo = AppStore.parseURL(url);

		if (url.toLowerCase().indexOf(".xml") < 0 && url.toLowerCase().indexOf(".html") < 0) {
			verb = "POST";
			soapHeader = '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><GetManifests xmlns="http://directory/" /></soap12:Body></soap12:Envelope>';
		}

		$.ajax(url, {
			async: false,
			cache: true,
			data: soapHeader,
			type: verb,
			dataType: "xml",
			contentType: "text/xml",

			success: function(xml) {
				if (xml.documentElement) {

					var manifest = XML2jsobj(xml.documentElement);

					if (manifest["soap:Body"]) {
						// soap service, drill down past the headers etc

						var manifests = manifest["soap:Body"].GetManifestsResponse.GetManifestsResult.Manifest;

						for (var idx = 0; idx < manifests.length; idx++) {
							manifest = manifests[idx];
							manifest.app.hostInfo = hostInfo;
							transformManifest(manifest.app, url);
							apps.push(manifest.app);
						}
					}
					else {
						// assume a single manifest
						var manifest = XML2jsobj(xml.documentElement);

						manifest.app.hostInfo = hostInfo;
						transformManifest(manifest.app, url);
						apps.push(manifest.app);
					}
				}

			},
			error: function(XHR, status, err) {
				var errMsg = "Error reading manifests (" + url + ")\n\nStatus code: " + XHR.status + " " + XHR.statusText;
				container.debugLog(container.LOGGING_LEVELS.ERROR, myContainerId, "loadManifests", errMsg);
				alert(errMsg);
			}
		});

		return apps;
	}

	function initEnvironment() {

		// only do the client side environment parsing for the HTML version

		if (!AppStore.HTMLMode) {
			var thisFile = AppStore.parseURL(window.location.href);
			var reg = /^html?$/i;
			AppStore.HTMLMode = reg.test(thisFile.extension);
		}

		if (!AppStore.HTMLMode) {
			return true;
		}

		htmlMode = true;

		var OK = true;
		var envPath = AppStore.QueryString["env"];

		if (!envPath) {
			envPath = "Environment.xml";
		}

		$.ajax(envPath, {
			async: false,
			cache: false,
			success: function(xml) {
				if (xml.documentElement) {
					environmentDefinition = XML2jsobj(xml.documentElement);
					var apps = [];

					if (environmentDefinition.apps.add.constructor == Array) {
						for (var idxApp = 0; idxApp < environmentDefinition.apps.add.length; idxApp++) {
							apps = loadManifests(environmentDefinition.apps.add[idxApp].host);
							manifestList = manifestList.concat(apps);
						}
					}
					else {
						apps = loadManifests(environmentDefinition.apps.add.host);
						manifestList = manifestList.concat(apps);
					}
				}
			},
			error: function(xhr, statusText, err) {
				alert("Unable to read environment definition (" + envPath + ")");
			}
		});

		// auth token
		$.mockjax({
			url: 'Ajax/Apps.aspx/GetContainerIdentity',
			responseTime: 10,
			responseText: {
				"d": {
					"userName": "Anonymous",
					"userType": "",
					"authenticationType": "urn:anonymous",
					"otherIdentifiers": [["urn:cba.cif", "1234"]],
					"additionalClaims": [["urn:cba.cif", "1234"]]
				}
			}
		});

		$.mockjax({
			url: 'Ajax/Apps.aspx/GetAuthTokenForApp',
			responseTime: 10,
			responseText: {
				"d": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjBYR1EzVk9VcW1taTYtYmdHeGhTaFJycUdoZyJ9.eyJVc2VyVHlwZSI6IkdlbmVyaWMiLCJMT0EiOiJOb3RBdXRoZW50aWNhdGVkIiwiYWN0b3J0b2tlbiI6IkFub255bW91cyIsImF1ZCI6IkNvbW1CYW5rLkFwcFN0b3JlLkFwcEJ1Zy4xLjAuMCIsIm5iZiI6MTM0NDkwODAzNC4zMTI1LCJpZGVudGl0eXByb3ZpZGVyIjoiQXBwU3RvcmVfSURQIiwiaXNzIjoiQ0JBLkRldmVsb3Blci52MSIsImV4cCI6MTUwMjY3NDQzNC4zMTI1fQ.UGLo26wT1fJtqkhtDryw0yYNU8Z59jfLlUZqgiJxn7ByLm-EAn-_Z-d2ITXG16pDi-ZyAYUc57-UGB5izl9Ox-CLHiUHB755ZPHoUICrmH9p87gt-xjyNT15qQFknoWAPNPGhcIF4u--GgFVbla_uzWQe4nNlGkJln27TOpdQ5U"
			}
		});

		$.mockjax({
			url: 'Ajax/Apps.aspx/GetManifests',
			responseTime: 150,
			responseText: {
				"d": manifestList
			}
		});

		var myPathParts = window.location.pathname.split("/");
		delete myPathParts[myPathParts.length - 1];
		var myInfo = AppStore.parseURL(window.location.href);

		var containerManifestPath = myInfo.origin + myPathParts.join("/") + "Manifest.xml";

		containerManifest = loadManifests(containerManifestPath);

		if (containerManifest.length != 1) {
			alert("Error loading container manifest (" + containerManifestPath + ")");
			OK = false;
		}
		else {
			containerManifest = containerManifest[0];

			$.mockjax({
				url: 'Ajax/Apps.aspx/GetContainerManifest',
				responseTime: 150,
				responseText: {
					"d": { app: containerManifest }
				}
			});
		}

		return OK;
	}

	function XML2jsobj(node) {
		var data = {};

		// append a value
		function add(name, value) {
			if (typeof (data[name]) != "undefined") {
				if (data[name].constructor != Array) {
					data[name] = [data[name]];
				}
				data[name][data[name].length] = value;
			}
			else {
				data[name] = value;
			}
		};

		// element attributes
		var c, cn;
		for (c = 0; cn = node.attributes[c]; c++) {
			add(cn.name, cn.value);
		}

		// child elements
		for (c = 0; cn = node.childNodes[c]; c++) {
			if (cn.nodeType == 1) {
				if (cn.childNodes.length == 1 && cn.firstChild.nodeType == 3) {
					// text value
					add(cn.nodeName, cn.firstChild.nodeValue);
				}
				else {
					// sub-object
					add(cn.nodeName, XML2jsobj(cn));
				}
			}
		}

		return data;
	}

	var xsiTypes = {
		exposes: {
			"ui": "ExposesInterfaceUI",
			"dataService": "ExposesInterfaceDataService"
		},

		invokes: {
			"ui": "InvokesInterfaceUI",
			"dataService": "InvokesInterfaceDataService"
		},

		invokesBindings: {
			"containerService": "InvokesInterfaceDataServiceBindingContainerService",
			"app": "InvokesInterfaceUIBindingApp",
			"container": "InvokesInterfaceUIBindingContainer"
		}
	};

	function transformManifest(manifest, url) {

		var urlInfo = AppStore.parseURL(url);

		function transformManifestItem(obj, fn, arrayName) {
			var items = [];
			var item;

			if (typeof (arrayName) == "undefined") {
				arrayName = "Items";
			}

			for (var key in obj) {
				if (obj[key].constructor == Array) {
					for (var idx = 0; idx < obj[key].length; idx++) {
						item = fn(key, obj[key][idx]);
						items.push(item);
					}
				}
				else {
					item = fn(key, obj[key]);
					items.push(item);
				}

				delete obj[key];
			}

			if (arrayName.length > 0) {
				obj[arrayName] = items;
				return obj;
			}
			else {
				return items;
			}
		}

		function transformExposesItem(key, item) {
			item["__type"] = xsiTypes.exposes[key];

			switch (key) {
				case "ui":
					if (typeof (item.containerHints) == "undefined") {
						item.containerHints = null;
					}

					// TODO: parameters

					break;

				case "data":
					// TODO: how should we handle data services in the developer container?
					break;
			}

			item.permittedConsumers = transformManifestItem(item.permittedConsumers || {}, transformPermittedConsumer, "");
			item.parameters = transformManifestItem(item.parameters || {}, transformParameter, "Any");
			return item;
		}

		function transformInvokesItem(key, item) {
			item["__type"] = xsiTypes.invokes[key];

			item.bindings = transformManifestItem(item.bindings, transformInvokesItemBinding);

			if (item["__type"] == AppStore.Container.INVOKEBINDING_TYPES.DATA) {
				// When invoking a data service the binding is one-to-one (apps are one-to-many)

				item.bindings.Item = item.bindings.Items[0];
				delete item.bindings.Items;
			}

			return item;
		}

		function transformInvokesItemBinding(key, item) {
			item["__type"] = xsiTypes.invokesBindings[key];

			switch (key) {
			}

			// TODO: parameters

			item.parameters = transformManifestItem(item.parameters || {}, transformParameter, "Any");
			return item;
		}

		function transformPermittedConsumers(obj) {
			var items = [];
			var item;

			if (obj.constructor != Array) {
				for (var key in obj) {
					item = transformPermittedConsumer(key, obj[key]);
					items.push(item);
					delete obj[key];
				}
			}
			else {
				for (var idx = 0; idx < obj.length; idx++) {
					item = transformPermittedConsumer(idx, obj[idx]);
					items.push(item);
					delete obj[idx];
				}
			}

			return items;

		}

		function transformParameter(key, item) {
			item["__type"] = item["xsi:type"].replace("dt:", "");
			item["__namespace"] = "";
			delete item["xsi:type"];
			return item;
		}

		function transformPermittedConsumer(key, item) {
			item["__type"] = item["xsi:type"];
			delete item["xsi:type"];
			return item;
		}

		function transformUnity(key, item) {
			return item;
		}

		function transformCustomThemeItem(key, item) {
			switch (key) {
				case "link":
					item[key] = transformManifestItem(item[key], transformUnity, "");
					break;

				default:
					break;
			}

			return item;
		}

		function transformExposedURLs(manifest) {

			for (var idx = 0; idx < manifest.exposes.Items.length; idx++) {
				var interface = manifest.exposes.Items[idx];

				if (interface.resolvesTo.toLowerCase().indexOf("http") != 0) {
					var relURL = interface.resolvesTo.replace(/^~?\/?/, "");
					var fullURL = manifest.hostInfo.origin + manifest.hostInfo.folder + relURL;
					interface.resolvesTo = fullURL;
				}
			}
		}

		// exposes
		var obj = manifest.exposes || {};
		manifest.exposes = transformManifestItem(obj, transformExposesItem);

		// make urls absolute
		transformExposedURLs(manifest, url);

		// invokes

		obj = manifest.invokes || {};
		manifest.invokes = transformManifestItem(obj, transformInvokesItem);

		// themes
		if (manifest.themes && manifest.themes.custom) {
			if (manifest.themes.custom.theme.constructor != Array) {
				manifest.themes.custom.theme = [manifest.themes.custom.theme];
			}

			for (var idxTheme = 0; idxTheme < manifest.themes.custom.theme.length; idxTheme++) {
				var theme = manifest.themes.custom.theme[idxTheme];

				if (theme.link && theme.link.constructor != Array) {
					theme.link = [theme.link];
				}

				// fix virtual paths
				for (var idxLink = 0; idxLink < theme.link.length; idxLink++) {
					if (theme.link[idxLink].href.toLowerCase().indexOf("http") != 0) {
						theme.link[idxLink].href = urlInfo.origin + urlInfo.folder + theme.link[idxLink].href.replace(/~\/?/, "");
					}
				}
			}
		}

		if (manifest.themes && manifest.themes.container && manifest.themes.container.supports) {
			manifest.themes.container = manifest.themes.container.supports;
		}
	}

	//-----------------------------------
	// container callbacks
	//-----------------------------------

	function onAppLaunchRequest() {
	}
	function onGetAppDisplayContainer(params) {
		alert("App '" + params.appInstance.appDescriptor.toString() + "' has requested to launch app '" + params.binding.appDescriptor.toString() + "' via interface '" + params.binding.invokedInterfaceId + "'.");
		return false;
	}
	function onAppLaunched() {
	}
	function onAppReady() {
	}
	function onAppClose() {
	}
	function onContextChange(appInstance, newContext, prevContext) {
		// For the moment we just pass any context changes through to the app.
		// TODO: enforce manifest declarations

		setCurrentContext(newContext);
		container.setAppContext(currentAppInstance, newContext);
		container.sendAppContext(currentAppInstance);

	}
	function onOASecurityAlert(source, alertType) {
		var appInstance = container.activeAppInstances[source.getClientID()];
		var appName = appInstance ? appInstance.appName : "(unknown)";

		switch (alertType) {
			case OpenAjax.hub.SecurityAlert.LoadTimeout:
				//alert("Application '" + appInstance.appName + "' has failed to load in a reasonable time.")
				break;
		}
	}

	function onContainerInit() {
		var html = $("#appTemplate").render(container.config.appManifests);

		$("#appList").append(html)
			.on("change", function(ev) {
				loadApp();
			});

		var $theme = $("#theme").find("option:selected");
		container.containerTheme = $theme.val();

		$("#theme").change(function(ev) {
			var $theme = $("#theme").find("option:selected");
			container.containerTheme = $theme.val();
			settings.containerTheme = container.containerTheme;
			settings.save();
			loadApp();
		});

		container.createAppFromDescriptor(new AppStore.AppDescriptor("CBA", "CommBank.AppStore.ContextEditor", "*"), null, null, $("#tabContextEditor"), null, null, null, null);

		setTimeout(function() {
			$('body').addClass('ready');
			//setAppLocation();

			var appLoaded = false;

			if (settings.publisherId && settings.appId && settings.version) {
				var $opt = $("#appList").find("option[data-publisherid='" + settings.publisherId + "'][data-appid='" + settings.appId + "'][data-version='" + settings.version + "']");

				if ($opt.length == 1) {
					$("#appList").val($opt.val());
					appLoaded = loadAppFromSettings();
				}
			}
			if (!appLoaded) {
				// if we can't find the last saved app then just load the first in the list

				$opt = $("#appList").find("option").first();

				if ($opt.length == 1) {
					$("#appList").val($opt.val());
					settings.publisherId = $opt.data("publisherid");
					settings.appId = $opt.data("appid");
					settings.version = $opt.data("version");
					appLoaded = loadAppFromSettings();
				}

				if (!appLoaded) {
					settings.publisherId = '';
					settings.appId = '';
					settings.version = '';
				}

				settings.save();
			}
		}, 100);

	}

	function loadApp() {
		if (currentAppInstance) {
			container.forceAppClose(currentAppInstance);
			currentAppInstance = null;
		}

		$selected = $("#appList").find("option:selected");
		settings.publisherId = $selected.data("publisherid");
		settings.appId = $selected.data("appid");
		settings.version = $selected.data("version");
		settings.save();

		loadAppFromSettings();
	}

	function getAppInitialContext(appDesc, interfaceId, interfaceVersion) {
		interfaceVersion = interfaceVersion || "*";
		interfaceId = interfaceId || "*";

		// TODO: read any app context info from local storage

		return null;
	}

	function loadAppFromSettings() {
		var appDesc = new AppStore.AppDescriptor(settings.publisherId, settings.appId, settings.version);
		var loaded = false;

		if (container.findAppManifestByAppDescriptor(appDesc)) {
			var context = getAppInitialContext() || getCurrentContext();

			currentAppInstance = container.createAppFromDescriptor(appDesc, null, context, $("#contentBody"), null, null, null, null);
			loaded = (currentAppInstance != null);
		} else {
			alert("Error: App not found in current environment (" + settings.publisherId + "." + settings.appId + "." + settings.version + ").");
		}

		if (loaded) {
			var loc = $('#contentBody > iframe').attr('src');
			loc = loc.substring(loc.indexOf('//') + 2); // Remove protocol.
			loc = loc.substring(loc.indexOf('/') + 1); // Remove host.
			loc = loc.substring(0, loc.lastIndexOf('/')); // Remove page.
			loc = loc.replace(/\//g, '_');
			app = loc;
			$('#instrumentation').attr('src', 'Instrumentation.aspx?app=' + app);
		}

		return loaded;
	}

	// trace display

	function clearTrace() {
		$(".tracedata").html("");
		container.debugLog(container.LOGGING_LEVELS.INFO, myContainerId, "clearTrace", "Trace cleared.");
	}

	var traceLevelClasses = ["verbose", "info", "warning", "error", "critical"];

	var traceLogger = container.registerLogger(container, settings.traceLevel, function(level, source, method, text) {
		var timestamp = new Date();
		var ms = "000" + timestamp.getMilliseconds();

		timestamp = timestamp.toLocaleTimeString() + ":" + ms.substring(ms.length - 3);

		var html = $("#traceItemTemplate").render({
			level: level,
			levelClass: traceLevelClasses[level],
			source: source,
			method: method,
			text: text,
			timestamp: timestamp
		});

		$(".tracedata").prepend(html);
		//$(".tracescrollframe").scrollTop(1000000);		
	});

	$("#traceLevel").on({
		"change": function(ev) {
			var newLevel = $("#traceLevel").find("option:selected").val();

			for (var lvl = 0; lvl < newLevel; lvl++) {
				$(".tracedata li[data-level='" + lvl + "']").addClass("hidden");
			}

			for (var lvl = newLevel; lvl <= container.LOGGING_LEVELS.CRITICAL; lvl++) {
				$(".tracedata li[data-level='" + lvl + "']").removeClass("hidden");
			}

			//$(".tracescrollframe").scrollTop(1000000);

			settings.traceLevel = newLevel;
			traceLogger.minLevel = newLevel;
			settings.save();
		}
	});

	// one message to start with...
	container.debugLog(container.LOGGING_LEVELS.INFO, myContainerId, "Initialise", "Container startup");
	// ...but we don't really need as much logging to the console log when we can see it all on screen
	container.debugMinLevel = container.LOGGING_LEVELS.WARNING;

	if (initEnvironment()) {

		$("#btnClearTrace").on({
			"click": clearTrace,
			"tap": clearTrace
		});

		// initialise container

		container.containerTheme = 'CommBank';

		var initParams = {

			containerId: myContainerId,
			user: {
				userId: window.Identity || "(anonymous)",
				fullName: window.Identity || "(anonymous)"
			},

			callbacks: {}
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_INIT_COMPLETE] = {
			fn: onContainerInit,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_APP_LAUNCH_REQUEST] = {
			fn: onAppLaunchRequest,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_APP_READY] = {
			fn: onAppReady,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_GET_APP_DISPLAY_CONTAINER] = {
			fn: onGetAppDisplayContainer,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_APP_LAUNCHED] = {
			fn: onAppLaunched,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_APP_CLOSE] = {
			fn: onAppClose,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_CONTEXT_CHANGE] = {
			fn: onContextChange,
			scope: this,
			data: null
		};

		initParams.callbacks[AppStore.Container.EVENTS.ON_OA_SECURITYALERT] = {
			fn: onOASecurityAlert,
			scope: this,
			data: null
		};

		container.init(initParams);
	}
	else {
		alert("Initialisation was unsuccessful.");
	}
});
