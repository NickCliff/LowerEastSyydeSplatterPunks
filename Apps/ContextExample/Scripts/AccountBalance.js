// Default.js

///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Common.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Ajax.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.App.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Container.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\jquery-1.7.2-vsdoc.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\jsrender.js" />
///<reference path="..\..\Common\AppStore\Scripts\jquery.mockjax.js" />
///<reference path="Scripts\AllData.js" />

AppStore.App.holdReadyMessage();

$(function() {

	// Note: this is a sample namespace.  Actual production namespaces will be URIs based on publisher details
	var CONTEXT_NAMESPACE = "CommBank.Customer.Account";

	// helper functions for jsRender
	$.views.helpers({
		formatState: function(val) {
			if (!val) {
				return null;
			}

			if (val.indexOf("DR") != -1) {
				return "debit";
			}
			else {
				return "credit";
			}
		}
	});

	//Listen to the context change event to notify the appof changes i.e. the selection of a different account
	AppStore.App.bind(AppStore.App.EVENTS.ON_CONTEXT_CHANGE, function(newContext, oldContext) {
		parseContext(newContext);
	});

	//If an account key has been set then use this to display the account detail
	function parseContext(newContext) {
		var contextElements = newContext.getElements();
		if (contextElements.length) {
			for (var i = 0; i < contextElements.length; i++) {
				if (contextElements[i].namespace === CONTEXT_NAMESPACE) {
					getAccountBalanceDetail(contextElements[i].data);
				}
			}
		}
	}

	//mockjax will intercept calls to /service/data
	$.mockjax({
		url: 'Default.aspx/GetAccountData',
		responseTime: 500,
		dataType: "json",
		response: function(settings) {
			var accountId = JSON.parse(settings.data).Account;

			var accounts = AllData.result.accounts.account;

			this.responseText = {};

			for (var idx = 0; idx < accounts.length; idx++) {
				var accountItem = accounts[idx];

				if (accountItem.id.toLowerCase() === accountId.toLowerCase()) {

					this.responseText = {
						success: true,
						data: {
							name: accountItem.name.preferredName.text,
							accNumber: accountItem.number.accountNumberFormatted.text,
							currentBalanceSign: accountItem.balance.sign,
							currentBalance: accountItem.balance.signed
						}
					};
				}
			}
		}
	});


	//Display the account detail by using MockJAX
	function getAccountBalanceDetail(accountId) {

		$.postJSON("Default.aspx/GetAccountData", { Account: accountId })
		.success(function(resp) {
			if (resp.success) {
				$('#content').html($('#accountBalanceTemplate').render(resp.data));
			}
		})
		.error(function(a, reason) {
			alert(reason);
		});
	}


	function init() {
		if (AppStore.App.context) {
			parseContext(AppStore.App.context);
		}

		AppStore.App.sendReadyMessage();
	}

	init();
});