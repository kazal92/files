// generic trace
function trace(pattern)
{
    var base_address = Module.findBaseAddress("DVIA-v2");

    // var offset = module_base.add(0x140808);
    // // console.log("    계산된 주소2 : "+ offset)

    // var caller = ptr('0x100598850');
    // console.log("     계산된 주소 : "+caller.sub(module_base));


    var type = (pattern.indexOf(" ") === -1) ? "module" : "objc";    // [A B]와 같이 공백이 있으면 objc, 없으면 모듈  
    // console.log("입력한 클래스 : " + pattern);
    var res = new ApiResolver(type);
    var matches = res.enumerateMatchesSync(pattern);
    var targets = uniqBy(matches, JSON.stringify);
    // console.log(JSON.stringify(matches, null, 4));

    console.log("\n################################# START ##############################");
    console.log("########################################################################"); 
    // console.log("-------------------------------------------------------------------------------------------"); 
    // console.log("베이스 주소 = " + base_address);
    console.log("-------------------------------------------------------------------------------------------"); 
    // 메모리 주소(frida) 주소 찾기
    var IDA_address = ptr(0x140850);
    var mem_address = base_address.add(IDA_address);
    // console.log("메모리 주소(Frida) =    IDA 주소 +  베이스 주소   : " + mem_address + " =    " + IDA_address + " + " + base_address);

    // IDA 주소 찾기
    var mem_address_2 = ptr(0x100ac127c);
    var IDA_address_2 = mem_address_2.sub(base_address)
    console.log("IDA 주소 = 메모리 주소 -  베이스 주소   :    " + IDA_address_2 + " = " + mem_address_2 + " - " + base_address);
    console.log("-------------------------------------------------------------------------------------------"); 
    console.log("IDA 리턴 주소 - 4 : " + ptr(mem_address_2 - 8).sub(base_address));
    console.log("리턴 주소 - 4 값 확인: " + Instruction.parse(ptr(mem_address_2 - 4)).toString());
    console.log("리턴 주소 : " + mem_address_2);
    console.log("IDA 리턴 주소 : " + IDA_address_2);



    targets.forEach(function(target) {
      if (type === "objc")
          traceObjC(target.address, target.name)
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
    console.log("-------------------------------------------------------------------------------------------"); 
    console.log("찾은 메소드 이름 : " + name); 
    console.log("찾은 메소드 주소 : " + impl); 
    // console.log("-------------------------------------------------------------------------------------------"); 


    Interceptor.attach(impl, {

        onEnter: function(args) {

            // debug only the intended calls
            this.flag = 0;
            // if (ObjC.Object(args[2]).toString() === "1234567890abcdef1234567890abcdef12345678")
                this.flag = 1;

            if (this.flag) {
                console.warn("\n[+] entered " + name);
                console.log("Return Address: " + this.returnAddress);

                // 함수가 끝난 후 리턴 주소가 어떤 함수나 코드에 해당하는지 확인
                console.log("\x1b[31mCaller:\x1b[0m \x1b[34m" + DebugSymbol.fromAddress(this.returnAddress) + "\x1b[0m\n");

                // 심볼 이름을 기반으로 그에 해당하는 메모리 주소와 함수 이름을 출력 
                // console.log("\x1b[31mCaller 2 :\x1b[0m \x1b[34m" + DebugSymbol.fromName(name) + "\x1b[0m\n");

                // console.log("\x1b[31margs[2]:\x1b[0m \x1b[34m" + args[2] + ", \x1b[32m" + ObjC.Object(args[2]) + "\x1b[0m")
                // console.log("\x1b[31margs[3]:\x1b[0m \x1b[34m" + args[3] + ", \x1b[32m" + ObjC.Object(args[3]) + "\x1b[0m")
                // console.log("\x1b[31margs[4]:\x1b[0m \x1b[34m" + args[4] + ", \x1b[32m" + ObjC.Object(args[4]) + "\x1b[0m")
                
                // print full backtrace
                console.log("\nBacktrace:\n" + Thread.backtrace(this.context, Backtracer.ACCURATE)
                     .map(DebugSymbol.fromAddress).join("\n"));
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
    trace("+[JailbreakDetection isJailbroken]")
    // trace("*[FireflySecurityUtil *]")
    // trace("*[ *ncrypt*]");
    // trace("*[* *]"); // 모든 클래스 추적. 앱이 다운됨
    // trace("exports:libSystem.B.dylib!CCCrypt");
    // trace("exports:libSystem.B.dylib!open");
    // trace("exports:*!open*");
    
} else {
    send("error: Objective-C Runtime is not available!");
}