

$(function () {

	// process form submit via JSON call

	$("form").submit(function (e) {

		// if (formIsValid()) {
		//		$.postJSON("api/myform.aspx/save", { foo: "bar" })
		//			.success(function(result) {
		//				alert("wo0t!!1!!");
		//			})
		//		.error(function(XHR, status, err) {
		//			alert("Bummer, dude");
		//		});
		//	}

		alert("Nice work.");
		return false;
	});
});