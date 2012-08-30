// Default.js

///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Common.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Ajax.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.App.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\AppStore.Container.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\jquery-1.7.2-vsdoc.js" />
///<reference path="..\..\..\Common\AppStore\Scripts\jquery.ui.autocomplete.js"/>

AppStore.App.holdReadyMessage();

$(function () {

	var AppStoreContext = new AppStore.Context();
	var itemToEdit = null;

	var EDIT_MODE = EDIT_MODE || {
		SAVE: "Save",
		EDIT: "Edit"
	}

	var LOCAL_STORAGE_NAMEPREFIX = "AppStoreContext___";

	// helper functions for jsRender
	$.views.helpers({
		stringify: function (d) {
			return JSON.stringify(d);
		}
	});

	//Set the edit and save mode
	function setMode(Mode) {
		$("#add").toggle(Mode === EDIT_MODE.SAVE);
		$("#reset").toggle(Mode === EDIT_MODE.SAVE);
		$("#setContext").toggle(Mode === EDIT_MODE.SAVE);

		$("#edit").toggle(Mode === EDIT_MODE.EDIT);
		$("#cancel").toggle(Mode === EDIT_MODE.EDIT);

	}

	//Get and display the list of items that are stored in the local AppStoreContext
	function search(args) {

		var data = [], result = [];
		var elements = AppStoreContext.getElements();

		for (var idx = 0; idx < elements.length; idx++) {
			data.push(elements[idx]);
		}

		if (!args || args.text == "") {
			result = data;
		}
		else {
			$.each(data,
                function (i, item) {
                	if (containsString(item, args.text)) {
                		result.push(item);
                	}
                }
            );
		}

		$('#content').html($('#contextItemTemplate').render(result));
	}

	function getSelectedContextElement(toElement) {
		var hidden = $(toElement).siblings('input');

		if (hidden)
			return (hidden) ? new AppStore.ContextElement($(hidden).attr('namespace'), $(hidden).attr('contextType'), getDataObjectFromString($(hidden).attr('data'))) : null;

	}

	function getDataObjectFromString(objectAsString) {
		var x, data;

		try {
			data = eval("x = " + objectAsString + ";");
		}
		catch (e) {
			alert("Error parsing the data expression.\n\nThe expression must evaluate to a valid JavaScript object e.g.\n\n{\n\t    foo: 'bar',\n    answer: 42\n}\n\nTo enter a single string you need to supply the containing quotes e.g.\n\n\"foo\"");
			return null;
		}

		return data;
	}

	$("#deleteContextSet")
		.toggle(false)
		.click(function () {
			if ($('#txtNamedContextSet').val() != "" && localStorage.getItem(LOCAL_STORAGE_NAMEPREFIX + $('#txtNamedContextSet').val()))
				localStorage.removeItem(LOCAL_STORAGE_NAMEPREFIX + $('#txtNamedContextSet').val());

			$("#txtNamedContextSet").autocomplete("option", { source: getSavedNamedContexts() });
			reset(true);
		});

	$('#content')
		.on('click', 'li > div > span > a:nth-child(1)', function (e) { //edit
			itemToEdit = getSelectedContextElement(this);
			if (itemToEdit) {
				setMode(EDIT_MODE.EDIT);
				$("#txtNamespace").val(itemToEdit.namespace);
				$("#txtContextType").val(itemToEdit.contextType);
				$("#txtData").val(JSON.stringify(itemToEdit.data));
			}
	});


	$('#content')
		.on('click', 'li > div > span > a:nth-child(2)', function (e) { //delete
			var item = getSelectedContextElement(this);
			if (item && confirm("Confirm that you want to delete item: " + item)) {
				AppStoreContext.removeContextElement(item);
				search({ text: '' });
			}
	});

	$('#saveContextSet')
		.toggle(localStorage != null)
		.click(function () {
			if ($('#txtNamedContextSet').val() == "") {
				alert("Please give this Context Set a name");
				return;
			}
			SaveNamedContext($('#txtNamedContextSet').val());
		});


	$("#add").click(function () {
		editOrSave(EDIT_MODE.SAVE);
	});

	$("#edit").click(function () {
		editOrSave(EDIT_MODE.EDIT);
	});


	$("#cancel").click(function () {
		setMode(EDIT_MODE.SAVE);
		itemToEdit = null;
	});

	$("#reset").click(function () {
		if (confirm("Confirm that you want to reset all the fields."))
			reset(true);
	});

	$("#setContext").click(function () {
		AppStore.App.setContext(AppStoreContext);
		alert("Context has been set.");
	});

	function reset(resetAll) {
		$("#txtNamespace").val("");
		$("#txtContextType").val("");
		$("#txtData").val("");

		if (resetAll) {
			$("#txtNamedContextSet").val("");
			$('#content').html("");
			$("#deleteContextSet").toggle(false);
			AppStoreContext = new AppStore.Context();
		}
	}

	//Load the context array from local storage
	function getSavedNamedContexts() {
		var savedContexts = [];
		if (localStorage) {
			for (i = 0; i < localStorage.length; i++) {
				if (localStorage.key(i).indexOf(LOCAL_STORAGE_NAMEPREFIX) == 0) {
					savedContexts.push(localStorage.key(i).replace(LOCAL_STORAGE_NAMEPREFIX, ""));
				}
			}
		}
		return savedContexts;
	}

	//Save a context item array to local storage
	function SaveNamedContext(Name) {
		localStorage.setItem(LOCAL_STORAGE_NAMEPREFIX + Name, JSON.stringify(AppStoreContext.getElements()));
		$("#txtNamedContextSet")
			.autocomplete("option", { source: getSavedNamedContexts() });
		alert("The context set: " + Name + " has been saved");
	}

	//Edit or Create a new item in the context item array
	function editOrSave(EditMode) {
		var valid = true;
		valid = validate($("#txtNamespace").val(), "^(?!\\s*$).+", $("#txtNamespace"), valid);
		valid = validate($("#txtContextType").val(), "^(?!\\s*$).+", $("#txtContextType"), valid);
		//valid = validate($("#txtData").val(), "^(?!\\s*$).+", $("#txtData"), valid);

		if (valid) {
			var namespace = $("#txtNamespace").val();
			var contextType = $("#txtContextType").val();

			var x;
			var data = getDataObjectFromString($("#txtData").val());
			if (!data)
				return;

			if (EditMode === EDIT_MODE.EDIT) {
				//delete the old item
				if (itemToEdit) {
					AppStoreContext.removeContextElement(itemToEdit);
					itemToEdit = null;
				}
				reset();
			}

			AppStoreContext.addNewContextElement(namespace, contextType, data);
			search({ text: '' });
			setMode(EDIT_MODE.SAVE);
		}
	}

	function init() {
		//Sample data for the coding competition
		var key = "Account Balance Sample 1";
		if (!localStorage.getItem(LOCAL_STORAGE_NAMEPREFIX + key))
			localStorage.setItem(LOCAL_STORAGE_NAMEPREFIX + key, "[{\"namespace\": \"CommBank.Customer.Account\",\"contextType\":\"Sample Account\",\"data\": \"A1\"}]");

		key = "Account Balance Sample 2";
		if (!localStorage.getItem(LOCAL_STORAGE_NAMEPREFIX + key))
			localStorage.setItem(LOCAL_STORAGE_NAMEPREFIX + key, "[{\"namespace\": \"CommBank.Customer.Account\",\"contextType\":\"Sample Account\",\"data\": \"A4\"}]");

		//Autocomplete for saved context
		var $input = $("#txtNamedContextSet").autocomplete({
			source: getSavedNamedContexts(),
			minLength: 0,
			select: function(event, ui) {
				$("#deleteContextSet").toggle(true);

				AppStoreContext = new AppStore.Context();

				var storedContext = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAMEPREFIX + ui.item.value));
				if (storedContext.length)
					for (i = 0; i < storedContext.length; i++)
						AppStoreContext.addNewContextElement(storedContext[i].namespace, storedContext[i].contextType, storedContext[i].data);

				search("");
			}
		}).addClass("ui-widget ui-widget-content ui-corner-left");

		$("<button type='button' id='btnNamedContext'>&nbsp;</button>")
		.attr("tabIndex", -1)
		.attr("title", "Show All Items")
		.insertAfter($input)
		.button({
			icons: {
				primary: "ui-icon-triangle-1-s"
			},
			text: false
		})
		.removeClass("ui-corner-all")
		.addClass("ui-corner-right ui-button-icon")
		.click(function() {
			// close if already visible                         
			if ($input.autocomplete("widget").is(":visible")) {
				$input.autocomplete("close");
				return;
			}
			$(this).blur();
			$input.autocomplete("search", "");
			$input.focus();
		});

		$("form").fixAppURL();

		AppStore.App.sendReadyMessage();
		search({ text: '' });
		setMode(EDIT_MODE.SAVE);
	}

	function containsString(item, searchText) {
		if (!item || !searchText)
			return false;

		return item.toString().toLowerCase().indexOf(searchText.toLowerCase()) > -1;
	}


	function validate(value, pattern, input, previousValid) {
		var reg = new RegExp('^' + pattern + '$');
		reg.multiline = true;

		if (reg.test(value)) {
			input.attr('title', '').removeClass('error').parents('.field').removeClass('error');
			return previousValid;
		} else {
			input.attr('title', input.attr('placeholder')).addClass('error').parents('.field').addClass('error');
			return false;
		}
	}

	init();

});
