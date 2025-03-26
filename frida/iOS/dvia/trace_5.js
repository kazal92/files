let matchCount = 0;
let baseAddress = Module.findBaseAddress("DVIA-v2"); // 앱 지정정
let inputAddress = "" // FRIDA 주소 찾을때 IDA 베이스주소(0x100000000) 뺴고 기입 EX) 0x12127C

if (ObjC.available) {
    trace("*[*Jail* *]")
    // trace('functions:*CoreDevice!*RemoteDevice*');
    // trace("jail")
    // trace("*[FireflySecurityUtil *]")
    // trace("*[ *ncrypt*]");
    // trace("*[* *]"); 모든 클래스 추적. 앱이 다운됨
    // trace("exports:libSystem.B.dylib!CCCrypt");
    // trace("exports:libSystem.B.dylib!open");
    // trace("exports:*!open*");
} else {
     console.log("error: Objective-C Runtime is not available!")
    };

    
function trace(pattern) 
{
    let type = (pattern.indexOf(" ") === -1) ? "module" : "objc";    // [A B]와 같이 공백이 있으면 objc, 없으면 모듈 
    if (type === "objc") {
        let res = new ApiResolver(type);
        let matches = res.enumerateMatchesSync(pattern);
        let targets = uniqBy(matches, JSON.stringify);

        for (let target in targets) {
            matchCount++;
            traceObjC(targets[target].address, targets[target].name); // traceObjC 호출
        }
    }
    else if (type === "module") {
        let modules = Process.enumerateModules()
        for (let module in modules) {
            // console.log("[*] "+modules[module].name);
            let exports = modules[module].enumerateExports();
            for (let exp in exports) {
                if (exports[exp].type === "function" && exports[exp].name.indexOf(pattern) !== -1) {
                    matchCount++;
                    traceModule(exports[exp].address, modules[module].name, exports[exp].name); // traceModule 호출
                }
            }
        }
    }
    console.log(`\x1b[1mStarted tracing ${matchCount} functions.\x1b[0m`);
    
    // console.log("-----------------------------------"); 
    // console.log("IDA 주소 = 프리다 주소 - 베이스 주소 
    // console.log("FRIDA 주소 = IDA 주소 +  베이스 주소  
    // console.log("-----------------------------------"); 

    // Convert FRIDA address to IDA address
    if (inputAddress) {
        if (inputAddress.length === 11 || inputAddress.length === 9) {
            console.log(`\nBase Address : ${baseAddress}`);
            let IDA_address = ptr(0x100000000).add(ptr(inputAddress).sub(baseAddress));
            console.log(`[OUTPUT] IDA Adress : ${IDA_address}`);
            console.log(`[INPUT] FRIDA Address : ${inputAddress}`);
        }
        // Convert IDA address to FRIDA address
        else if (inputAddress.length === 8 || inputAddress.length === 6) {
            console.log(`\nBase Address : ${baseAddress}`);
            var frida_Address = ptr(inputAddress).add(baseAddress);
            console.log(`[INPUT] IDA Address : ${inputAddress}`)
            console.log(`[OUTPUT] FRIDA Address : ${frida_Address}`);
            } 
    } else {
        console.log("[*] Input Address not provided.");
    }

}

// remove duplicates from array
function uniqBy(array, key) 
{
    let seen = {};
    return array.filter(function(item) {
        let k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}

// trace ObjC methods
function traceObjC(impl, name)
{
    console.log(`[MATCH] ${name} : ${impl}`);

    Interceptor.attach(impl, {
        onEnter: function(args) {

            // debug only the intended calls
            // this.flag = 0;
            // if (ObjC.Object(args[2]).toString() === "1234567890abcdef1234567890abcdef12345678")
                this.flag = 1;

            if (this.flag) {
                // print caller
                // console.log("\x1b[31m[ENTER] Caller:\x1b[0m \x1b[34m" +  DebugSymbol.fromAddress(this.returnAddress) + "\x1b[0m\n");
                console.log(`\x1b[34m[ENTER] ${name}()\x1b[0m`); // 함수 호출
                // print args
                // console.log("\x1b[31margs[2]:\x1b[0m \x1b[34m" + args[2] + ", \x1b[32m" + ObjC.Object(args[2]) + "\x1b[0m")
                // console.log("\x1b[31margs[3]:\x1b[0m \x1b[34m" + args[3] + ", \x1b[32m" + ObjC.Object(args[3]) + "\x1b[0m")
                // console.log("\x1b[31margs[4]:\x1b[0m \x1b[34m" + args[4] + ", \x1b[32m" + ObjC.Object(args[4]) + "\x1b[0m")
                
                // print full backtrace
                // console.log("\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE)
                //      .map(DebugSymbol.fromAddress).join("\n"));
            }
        },
        onLeave: function(retval) { //LEAVE

            if (this.flag) {
                console.log(`\x1b[31m[LEAVE] ${name}() \x1b[0m \x1b[33mReturn Value : ${retval}\x1b[0m`); // 함수 종료
            }
        }
    });
}

// trace Module functions
function traceModule(impl, moduleName, exportName)
{
    console.log(`[MATCH] $ ${moduleName} : ${exportName}() : ${impl}`);
    Interceptor.attach(impl, {
        onEnter: function(args) {

            // debug only the intended calls
            this.flag = 0;
            // let filename = Memory.readCString(ptr(args[0]));
            // if (filename.indexOf("Bundle") === -1 && filename.indexOf("Cache") === -1) // exclusion list
            // if (filename.indexOf("my.interesting.file") !== -1) // inclusion list
                this.flag = 1;

            if (this.flag) {
                console.log(`\x1b[34m[ENTER]  ${moduleName} : ${exportName}()\x1b[0m`); // 함수 호출


                // print backtrace
                // console.log("\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE)
                //         .map(DebugSymbol.fromAddress).join("\n"));
            }
        },
        onLeave: function(retval) {
            if (this.flag) {
                console.log(`\x1b[31m[LEAVE]  ${moduleName} : ${exportName}() \x1b[0m \x1b[33mReturn Value : ${retval}\x1b[0m`); // 함수 종료
            }
        }
    });
}