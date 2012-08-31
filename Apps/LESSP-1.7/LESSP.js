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

function getName2(){
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

function goEdit() {
  document.location = AppStore.App.checkQueryString("./edit.html");
}

function goCancel(){
  document.location = AppStore.App.checkQueryString("./cancel.html");
}

function goConfirm(){
	document.location = AppStore.App.checkQueryString("./confirm.php");
}

function goHome(){
  document.location = AppStore.App.checkQueryString("./start.html");
}

function goBack(){
	window.history.back()
}