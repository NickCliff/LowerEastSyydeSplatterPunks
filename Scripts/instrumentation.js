$(function() {
	var offset = 0;
	function updateLog() {
		if ($('#log').is(':visible')) {
			$.postJSON('Instrumentation.aspx/GetLog', { app: app, offset: offset })
				.success(function(data) {
					if (data.offset > 0) {
						offset += data.offset;
						$('#log').html($('#log').html() + data.log);
						$(document.body).animate({ scrollTop: $(document).height() }, 'slow');
					}
				});
		}
	};
	setInterval(function() { updateLog(); }, 5000);
	updateLog();
});
