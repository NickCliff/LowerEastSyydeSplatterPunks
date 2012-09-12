var localhost = "127.0.0.1";
var port = "8124";
//var day = "Thursday";

//'{"result":{"identity":{"netbankId": "12345678","friendlyName": "Mr John Smith","lastSuccessfulLogin": "2002-09-24"},"proposedTransaction": {"id": "TC1","description": {"cleaned": "Fee (STG ATM)","raw": "Fee (STG ATM)"},"amount": {"currency": "AUD","signed": "2","unsigned": "2","sign": "DR"},"accounts": {"fromAccount": {"id": "Account 1" },"toAccount": {"id": "Account 2" }}}}}'

//wait for document to be ready
$(document).ready(function() {
	$("form#testHarness").bind('submit', function() {
		runFor($('#dayToSend').val());
		return false;
	});
	$("form#start").bind('submit', function() {
		goConfirm('start');
		return false;
	});
	$("form#edit").bind('submit', function() {
		goConfirm('edit');
		return false;
	});
	$("form#confirm").bind('submit', function() {
		goCancel('confirm');
		return false;
	});
//TODO: adjust this to work with different inputs depending on test harness
//	runFor("thursday");
	
	setup();
})

function runFor(input){
	jQuery.ajax({
			url: 'http://' + localhost + ":" + port + "/" + input,
	//	    url: 'http://127.0.0.1:8124/',
	    dataType: "jsonp",
	    jsonpCallback: "jsonCallback",
	    cache: false,
	    timeout: 5000,
	    success: function(data) {
	       initialise(data);
	    },
	    error: function(jqXHR, textStatus, errorThrown) {
	        alert('error ' + textStatus + " " + errorThrown);
	    }
	});
}

function setup(){
		$('#blkBar').text("Test harnass")
	
	whereami('testHarness');
	hideIt('start')
	hideIt('edit');
	hideIt('thanks');
	hideIt('confirm');
	showIt('testHarness');
}

function initialise(json){
	whereami('start');
	hideIt('edit');
	hideIt('thanks');
	hideIt('confirm');
	hideIt('testHarness');
	showIt('start');
	
	//updates values in 'start'
	var jsonFeed = getJSON(json, 'predict');
	var reg = getRegularCustomerAccountsAndValue(jsonFeed);
	$('#acctAndVal').text("$" + reg[3] + " from " + reg[0] + " to " + reg[1] + " ");
	$('#tranVal').val(reg[3]);
	$('#fromAcct').val(reg[0]);
	$('#toAcct').val(reg[1]);
	
	var val = howOften(jsonFeed); 
	$('#often').text("Make this a regular transaction, " + val[0] + ", from today (" + val[4] + "/" + val[5] + "/" + val[6] + ")");
	$('#howOften').text("Make this a regular transaction, "+ val[0] + ", from today (" + val[4] + "/" + val[5] + "/" + val[6] + ")");
	$('#period').val(val[1]); //grabs period code
	$('#date').val(val[3]); //grabs today's date
	
	$('#blkBar').text("Welcome, " + getJSON(json, 'id'));

	//updates values in 'edit'
	$("#editVal").attr("placeholder", "$" + reg[3]);

	json = getJSON(json, 'acctList');	
	addOptions(json, "#editFrom", jsonFeed[3]);
	addOptions(json, "#editTo", jsonFeed[4]);
}

function addOptions(json, element, select){
	while(element.firstChild) {
		element.remove(element.firstChild)
	}
	
	jQuery.each(json, function(i, e){
		if(select == e.id){
			$(element).append('<option value="' + e.id + '" selected="selected">' + e.id + "</option>");
		} else {
			$(element).append('<option value="' + e.id + '">' + e.id + '</option>');
		}
	});
	
}

function whereami(where){
	if(where != "thanks"){
		$('#whereami').val(where);
	}
}

$(function() {
	// use the AppStore.App jQuery plugin to fix up any URLs to add the current app context data
	// you need to use this plugin to adjust the URLs for any elements that might cause a navigation event e.g. forms, links
	$("form, a").fixAppURL();

	// show valid links, hook up app navigation to links
	$(".appLink").click(
		function() {
			AppStore.App.navigate($(this).data("endpoint"), { colour: $(this).data("colour"), flavour: $(this).data("flavour") });
			return false;
		}
	).toggleClass(
		function(i, c, u) {
			return AppStore.App.canNavigate($(this).data("endpoint")) ? "hidden" : 'canNavigate';
		}
	);
});

/**
	* returns the transaction we're suggesting for the customer based off the JSON this function is fed.
	*
 	* inputJSON == json string for processing
 	* why:
	* 	- ID: want to know the id of whoever
	*		- predict: what are we predicting? (acctA, acctB, $ value)
	*		- acctList: list of accounts for editing value
	*		- regular: how often (i.e. weekly, fortnightly etc)
 	*/
function getJSON(inputJSON, why){
	var input = jQuery.parseJSON(inputJSON);
	if(why == "id"){
		return input.result.friendlyName;
	}
	if(why == "predict"){
		var proposed = new Array(5);
		proposed[0] = "Predicted transaction";
		proposed[1] = input.result.amount;
		proposed[2] = input.result.amount;
		proposed[3] = input.result.fromAccountID;
		proposed[4] = input.result.toAccountID;
		return proposed;
	}
	if(why == "acctList"){
		return input.result.accounts; 
	}
	if(why == "regular"){
		//to be built if time allows
		return "weekly"
	}
}

function getCustomerName(json){
	return getJSON(inputJSON, "id");
}

//replace this once we get the database in place
function getRegularCustomerAccountsAndValue(jsonFeed){
	
	var regValues = new Array(4);
	regValues[0] = jsonFeed[3];
	regValues[1] = jsonFeed[4];
	regValues[2] = jsonFeed[1];
	regValues[3] = jsonFeed[1];
	
	return regValues;
}

//replace this once we get the database in place
//Use IDs instead of weekly etc in db (then we can do monthly/fortnightly etc)
function howOften(jsonFeed){
	var when = new Array(7);
	when[0] = "weekly";
	when[1] = 1; //code for when[0] (hardcoded to 'weekly' currently)
	when[2] = "thursdays";
	var today = new Date();
	when[3] = today; //for setting up a regular transaction from today
	when[4] = today.getDate();
	when[5] = today.getMonth()+1;
	when[6] = today.getFullYear();
	
	return when;
}

function showIt(className){
	whereami(className);
	document.getElementById(className).style.display="inline";
}

function hideIt(className){
		document.getElementById(className).style.display="none";
}

function receiptNumber(){
	return Math.floor(Math.random()*(999999-100000+1)+100000);
}

function populateConfirm(whoami){
	//grab from default page
	var receipt = receiptNumber();
	var date = new Date();
	var date = (date.getDate()) + "/" + (date.getMonth()+1) + "/" + (date.getFullYear());
	var from = document.getElementById("fromAcct").value;
	var to = document.getElementById("toAcct").value;
	var amt = document.getElementById("tranVal").value;
	var desc = "My regular transaction"
	
	if(whoami == 'edit'){
		//grab from edit page
		from = document.getElementById("editFrom").value;
		to = document.getElementById("editTo").value;
		amt = document.getElementById("editVal").value;
		//this could be more clever
		if(amt == ""){
			amt = document.getElementById("editVal").placeholder;
			amt = amt.split("$")[1]
		}
	}
	writeToConfirm(receipt, date, from, to, desc, amt);
}

function writeToConfirm(receipt, date, from, to, desc, amt){
	document.getElementById("confirmReceipt").innerHTML = receipt;
	document.getElementById("confirmToday").innerHTML = date;
	document.getElementById("confirmFrom").innerHTML = from;
	document.getElementById("confirmTo").innerHTML = to;
	document.getElementById("confirmDesc").innerHTML = desc;
	document.getElementById("confirmAmount").innerHTML = "$" + amt;
}

function goEdit(whoami) {
  hideIt(whoami);
	showIt('edit');
	//document.location = AppStore.App.checkQueryString("./edit.html");
}

function goCancel(whoami){
	hideIt(whoami);
	showIt('thanks');
  //document.location = AppStore.App.checkQueryString("./cancel.html");
}

function goConfirm(whoami){
	hideIt(whoami);
	showIt('confirm')
	
	populateConfirm(whoami)
	//document.location = AppStore.App.checkQueryString("./confirm.php");
}

function goHome(){
  initialise();
	//document.location = AppStore.App.checkQueryString("./start.html");
}

//Work out how to work this as a 'back' button -- no rush
function leaveThanks(){
	//need to be able to feed back to 'edit', 'start', and 'confirm' :):)
}

function goBack(){
	hideIt('start');
	hideIt('edit');
	hideIt('thanks');
	hideIt('confirm');
	showIt(document.getElementById('whereami').value)
}
