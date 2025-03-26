function traceModule(pattern) {
    var matchCount = 0;
    var modules = Process.enumerateModules();    // 프로세스 구동에 필요한 모듈이 메모리에 올라가게 올라가게 되는데 이 모듈을 열거함
    modules.forEach(function(module) {
        var exports = module.enumerateExports(); //  모듈 내보내기를 열거
        exports.forEach(function(exp) {
            // console.log(`${exp.name} :  ${exp.type}`);
            if (exp.type === 'function' && exp.name.indexOf(pattern) !== -1) {
                matchCount++; 
                console.log(`[MATCh] ${exp.name}()`);
                
                Interceptor.attach(exp.address, {
                    onEnter: function(args) {
                        console.log(`\x1b[34m[ENTER] ${module.name}.${exp.name}()\x1b[0m`); // 함수 호출
                    },
                    onLeave: function(retval) {
                        console.log(`\x1b[31m[LEAVE] ${module.name}.${exp.name}() \x1b[0m \x1b[33mReturn Value : ${retval}\x1b[0m`); // 함수 종료
                    }
                });
            }
        });
    });

    console.log(`\x1b[1mStarted tracing ${matchCount} functions.\x1b[0m`);
}

// 모든 Objective-C 클래스에서 "Jail"을 포함하는 메서드를 후킹하는 함수
function traceObjC(pattern) {
    for (const className in ObjC.classes) {
        const clazz = ObjC.classes[className];
        for (const methodName in clazz) {
            if (methodName.indexOf(pattern) !== -1) {
                const method = clazz[methodName];
                if (method.implementation) {
                    Interceptor.attach(method.implementation, {
                        onEnter: function(args) {
                            console.log(`[+] Entering ${className}.${methodName}`);
                        },
                        onLeave: function(retval) {
                            console.log(`[+] Leaving ${className}.${methodName} `);
                        }
                    });
                }
            }
        }
    }
}

// "Jail"을 포함하는 함수와 메서드 후킹
traceModule('Jail');
// traceObjC('Jail');