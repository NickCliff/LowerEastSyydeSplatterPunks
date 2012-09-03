$(document).ready(function() {
	$("form#start").bind('submit', function() {
		goConfirm('start');
		return false;
	});
	$("form#edit").bind('submit', function() {
		goConfirm('edit');
		return false;
	});
	
	initialise();
})

var inputJSON = '{"result":{"identity":{"netbankId": "12345678","friendlyName": "Mr John Smith","lastSuccessfulLogin": "2002-09-24"},"proposedTransaction": {"id": "TC1","description": {"cleaned": "Fee (STG ATM)","raw": "Fee (STG ATM)"},"amount": {"currency": "AUD","signed": "2","unsigned": "2","sign": "DR"},"accounts": {"fromAccount": {"id": "Account 1" },"toAccount": {"id": "Account 2" }}}}}'

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

//replace this once we get the database in place
function getCustomerName(){
	return "Nick";
}

//replace this once we get the database in place
function getRegularCustomerAccountsAndValue(){
	var regValues = new Array(4);
	regValues[0] = "Account 1";
	regValues[1] = "Account 2";
	regValues[2] = 20.00;
	regValues[3] = "20.00"
	
	return regValues;
}

//replace this once we get the database in place
//Use IDs instead of weekly etc in db (then we can do monthly/fortnightly etc)
function howOften(){
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

function initialise(){
	hideIt('edit');
	hideIt('thanks');
	hideIt('confirm');
}

function showIt(className){
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

function goEdit() {
  hideIt('start');
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
	window.history.back()
}
