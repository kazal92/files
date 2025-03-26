Java.perform(function () {
    // https://developer.android.com/reference/android/view/Window?_gl=1*atneli*_up*MQ..*_ga*NzA2NTA0ODE5LjE3MzcwMDYxMjk.*_ga_6HH9YJMN9M*MTczNzAwNjEyOS4xLjAuMTczNzAwNjc0OC4wLjAuMzQ1NzU5MDE1#setFlags(int,%20int)
    // public void setFlags (int flags, int mask)
    // flags	int: The new window flags (see WindowManager.LayoutParams).
    // mask	    int: Which of the window flag bits to modify.

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