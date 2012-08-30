// AppStore.Debug.js

window.AppStore = window.AppStore || new Object();

window.AppStore.Debug = window.AppStore.Debug ||
{
    LEVELS:
    {
        INFO: 1,
        WARNING: 2,
        ERROR: 3,
        CRITICAL: 4
    },

    debugMinLevel: 0,

    debugLog: function (level, source, method, text)
    {
        if (level > this.debugMinLevel)
        {
            if (window.console)
            {
                var msg = source + ((method && method.length > 0) ? "." + method : '') + ': ' + text;
                window.console.log(msg);
            }
        }
    },

    formatExceptionData: function (ex)
    {
        var msg = "Source: " + ex.Source + ", Description: " + ex.Description + ", ErrorNumber: " + ex.ErrorNumber + ", Line: " + ex.Line + ", Severity: " + ex.Severity + ", Column: " + ex.Column;
        return msg;
    },

    init: function ()
    {
        //debugDisplay.html("<table><thead><tr><th>Source</th><th>Description</th></thead><tbody></tbody></table>");
    }
};

window.AppStore.Debug.init();
