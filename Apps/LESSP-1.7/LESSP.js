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

function goEdit() {
  document.location = AppStore.App.checkQueryString("./edit.html");
}

function goCancel(){
  document.location = AppStore.App.checkQueryString("./cancel.html");
}

function goHome(){
  document.location = AppStore.App.checkQueryString("./start.html");
}

function goBack(){
	window.history.back()
}