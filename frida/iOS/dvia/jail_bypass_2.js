/// <reference path="d:\works\frida\ios\frida-gum.d.ts" />

var test = ObjC.classes.NSFileManager.$ownMethods;
console.log(JSON.stringify(test, null, 4));

// var test2 = ObjC.classes.NSString.$ownMethods;
// console.log(JSON.stringify(test2, null, 4));

var myResolver = new ApiResolver('objc');
var searchResults = myResolver.enumerateMatchesSync('-[NSFileManager fileExist*:]');
// console.log(JSON.stringify(searchResults, null, 4));
console.log("\n")

var result_ptr = searchResults[0].address

Interceptor.attach(result_ptr, {
    onEnter(args) {
        var modify_path = "/ABCD"
        this.filePath = new ObjC.Object(args[2]).toString();
        if (this.filePath === "/Applications/Cydia.app") {
            args[2] = ObjC.classes.NSString.stringWithString_(modify_path);
        }
        else if (this.filePath === "/Library/MobileSubstrate/MobileSubstrate.dylib"){
            args[2] = ObjC.classes.NSString.stringWithString_(modify_path);
        }
        else if (this.filePath === "/bin/bash"){
            args[2] = ObjC.classes.NSString.stringWithString_(modify_path);
        }
        else if (this.filePath === "/usr/sbin/sshd"){
            args[2] = ObjC.classes.NSString.stringWithString_(modify_path);
        }
        else if(this.filePath === "/etc/apt"){
            args[2] = ObjC.classes.NSString.stringWithString_(modify_path);
        }
        console.log("[frida] original path : " + this.filePath);
        console.log("[frida]   modify path : " + modify_path);
    },
    onLeave(retval) { 
        // if (this.filePath === "/bin/bash") {
        console.log("[frida]  return value : " + retval + '\n');
        
        // }
    }
});

// console.log("\n")   
// var hook = ObjC.classes.NSFileManager["- fileExistsAtPath:"]
// Interceptor.attach(hook.implementation, {
//     onEnter: function(args){
//         var filePath = new ObjC.Object(args[2]).toString();
             
//         console.log("\n" + filePath);
//     },
//     onLeave: function(retval){
//         console.log(retval);

//     }
// });