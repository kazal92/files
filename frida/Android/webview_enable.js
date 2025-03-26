Java.perform(function() {
    console.log("Current PID: " + Process.id);
    var Webview = Java.use("android.webkit.WebView")
    Webview.loadUrl.overload("java.lang.String").implementation = function(url) {
        console.log("[+]Loading URL from", url);
        this.setWebContentsDebuggingEnabled(true);
        this.loadUrl.overload("java.lang.String").call(this, url);
    }
    
    var Window = Java.use("android.view.Window");
    var setFlags = Window.setFlags; //.overload("int", "int")

    setFlags.implementation = function (flags, mask) {
        console.log(`[*] call setFlags() -> FLAG: ${flags} , MASK: ${mask}`);
        if (flags == 8192){
            console.log("[-] FLAG_SECURE Call -> Disable FLAG_SECURE");
            flags = 0;
        };
        setFlags.call(this, flags, mask);
    };
});