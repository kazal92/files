var window = ObjC.classes.UIWindow.keyWindow();
var rootControl = window.rootViewController();
console.log("\n\x1b[32m" + rootControl['- _printHierarchy']().toString() + "\x1b[0m"); // 
// console.log("\n\x1b[34m" + window['- _autolayoutTrace']().toString() + "\x1b[0m");