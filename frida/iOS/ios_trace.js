/// <reference path="d:\works\frida\ios\frida-gum.d.ts" />

// generic trace
function trace(pattern)
{
    var type = (pattern.indexOf(" ") === -1) ? "module" : "objc";    // [A B]와 같이 공백이 있으면 objc, 없으면 모듈  
    var res = new ApiResolver(type);
    var matches = res.enumerateMatchesSync(pattern);
    var targets = uniqBy(matches, JSON.stringify);

    targets.forEach(function(target) {
      if (type === "objc")
          traceObjC(target.address, target.name);
      else if (type === "module")
          traceModule(target.address, target.name);
  });
}

// remove duplicates from array
function uniqBy(array, key) 
{
    var seen = {};
    return array.filter(function(item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}

// trace ObjC methods
function traceObjC(impl, name)
{
    console.log("Tracing " + name);

    Interceptor.attach(impl, {

        onEnter: function(args) {

            // debug only the intended calls
            this.flag = 0;
            // if (ObjC.Object(args[2]).toString() === "1234567890abcdef1234567890abcdef12345678")
                this.flag = 1;

            if (this.flag) {
                console.warn("\n[+] entered " + name);
                // print caller
                console.log("\x1b[31mCaller:\x1b[0m \x1b[34m" + DebugSymbol.fromAddress(this.returnAddress) + "\x1b[0m\n");

                // print args
                // console.log("\x1b[31margs[2]:\x1b[0m \x1b[34m" + args[2] + ", \x1b[32m" + ObjC.Object(args[2]) + "\x1b[0m")
                // console.log("\x1b[31margs[3]:\x1b[0m \x1b[34m" + args[3] + ", \x1b[32m" + ObjC.Object(args[3]) + "\x1b[0m")
                // console.log("\x1b[31margs[4]:\x1b[0m \x1b[34m" + args[4] + ", \x1b[32m" + ObjC.Object(args[4]) + "\x1b[0m")
                
                // // print full backtrace
                // console.log("\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE)
                //      .map(DebugSymbol.fromAddress).join("\n"));
            }
        },

        onLeave: function(retval) {

            if (this.flag) {
                // print retval
                console.log("\n\x1b[31mretval:\x1b[0m \x1b[34m" + retval + "\x1b[0m");
                console.warn("[-] exiting " + name);
            }
        }

    });
}

// trace Module functions
function traceModule(impl, name)
{
    console.log("Tracing " + name);

    Interceptor.attach(impl, {

        onEnter: function(args) {

            // debug only the intended calls
            this.flag = 0;
            // var filename = Memory.readCString(ptr(args[0]));
            // if (filename.indexOf("Bundle") === -1 && filename.indexOf("Cache") === -1) // exclusion list
            // if (filename.indexOf("my.interesting.file") !== -1) // inclusion list
                this.flag = 1;

            if (this.flag) {
                console.warn("\n*** entered " + name);

                // print backtrace
                console.log("\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE)
                        .map(DebugSymbol.fromAddress).join("\n"));
            }
        },

        onLeave: function(retval) {

            if (this.flag) {
                // print retval
                console.log("\nretval: " + retval);
                console.warn("\n*** exiting " + name);
            }
        }

    });
}

// usage examples. 관심있는 클래스를 명시. 대소문자 구분
if (ObjC.available) {
    trace("*[*Jail* *]")
    // trace("*[FireflySecurityUtil *]")
    // trace("*[ *ncrypt*]");
    // trace("*[* *]"); 모든 클래스 추적. 앱이 다운됨
    // trace("exports:libSystem.B.dylib!CCCrypt");
    // trace("exports:libSystem.B.dylib!open");
    // trace("exports:*!open*");
    
} else {
    send("error: Objective-C Runtime is not available!");
}