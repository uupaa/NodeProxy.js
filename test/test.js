var ModuleTestNodeProxy = (function(global) {

var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

var _runOnNode = "process" in global;
var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

var test = new Test("NodeProxy", {
        disable:    false,
        browser:    false,
        worker:     false,
        node:       true,
        button:     true,
        both:       true,
    });

if (_runOnBrowser) {
    test.add([
        testProxy,
        testProxyBuffer,
    ]);
} else if (_runOnNode) {
    test.add([ testNodeProxy ]);
}

return test.run().clone();


function testProxy(test, pass, miss) {
    var href = _runOnWorker  ? this.href
             : _runOnBrowser ? location.href : "";

    var task = new Task(3, function(err, buffer) {
            if ( !err &&
                 buffer.xhr   === buffer.proxy &&
                 buffer.proxy === buffer.proxy_get ) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });

    // ----------------------------------------------
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("load", function(event) {
        task.set("xhr", this.responseText);
        task.pass();
    });
    xhr.addEventListener("error", function(error) { task.miss(); });
    xhr.open("GET", href);
    xhr.send();

    // ----------------------------------------------
    var proxy = new Proxy();

    proxy.on("load", function(event) {
        task.set("proxy", this.responseText);
        task.pass();
    });
    proxy.on("error", function(error) { task.miss(); });
    proxy.open("GET", href);
    proxy.send();

    // ----------------------------------------------
    var proxy2 = new Proxy();

    proxy2.get(href, function(error, responseText, xhr) {
        task.set("proxy_get", responseText);
        task.pass();
    });
}

function testProxyBuffer(test, pass, miss) {
    var href = _runOnWorker  ? this.href
             : _runOnBrowser ? location.href : "";

    var task = new Task(2, function(err, buffer) {
            var ok = false;

            debugger;
            if (!err) {
                if (buffer.xhr.constructor.name === "ArrayBuffer") {
                    if (buffer.proxy.constructor.name === "ArrayBuffer") {
                        ok = true;
                    }
                }
            }

            if (ok) {
                test.done(pass());
            } else {
                test.done(miss());
            }
        });

    // ----------------------------------------------
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("load", function(event) {
        task.set("xhr", this.response);
        task.pass();
    });
    xhr.addEventListener("error", function(error) { task.miss(); });
    xhr.open("GET", href);
    xhr.responseType = "arraybuffer";
    xhr.send();

    // ----------------------------------------------
    var proxy = new Proxy();

    proxy.on("load", function(event) {
        task.set("proxy", this.response);
        task.pass();
    });
    proxy.on("error", function(error) { task.miss(); });
    proxy.open("GET", href);
    proxy.responseType = "arraybuffer";
    proxy.send();
}



function testNodeProxy(test, pass, miss) {
    var absolute = "http://example.com/";
    var relative = "./test/index.html";
    var localFile = process.cwd() + "/test/index.html";
    var fileScheme = "file://" + process.cwd() + "/test/index.html";

    var task = new Task(4, function(err, buffer) {
            if ( buffer.absolute &&
                 buffer.relative &&
                 buffer.localFile &&
                 buffer.fileScheme ) {

                test.done(pass());
            } else {
                test.done(miss());
            }
        });

    // ----------------------------------------------
    var proxy = new NodeProxy();

    proxy.on("load", function(event) {
        console.log(CONSOLE_COLOR.GREEN + "\n  absolute: " + absolute + "\n" + CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + CONSOLE_COLOR.CLEAR);

        task.set("absolute", this.responseText);
        task.pass();

      //console.log(proxy.getAllResponseHeaders());
    });
    proxy.on("error", function() {
        debugger;
        console.log("Error Proxy");
        task.miss();
    });
    proxy.open("GET", absolute);
    proxy.send();

    // ----------------------------------------------
    var proxy2 = new NodeProxy();

    proxy2.on("load", function(event) {
        console.log(CONSOLE_COLOR.GREEN + "\n  relative: " + relative + "\n" + CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + CONSOLE_COLOR.CLEAR);

        task.set("relative", this.responseText);
        task.pass();
    });
    proxy2.on("error", function() {
        debugger;
        console.log("Error Proxy2");
        task.miss();
    });
    proxy2.open("GET", relative);
    proxy2.send();


    // ----------------------------------------------
    var proxy3 = new NodeProxy();

    proxy3.on("load", function(event) {
        console.log(CONSOLE_COLOR.GREEN + "\n  localFile: " + localFile + "\n" + CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + CONSOLE_COLOR.CLEAR);

        task.set("localFile", this.responseText);
        task.pass();
    });
    proxy3.on("error", function() {
        debugger;
        console.log("Error Proxy3");
        task.miss();
    });
    proxy3.open("GET", localFile);
    proxy3.send();

    // ----------------------------------------------
    var proxy4 = new NodeProxy();

    proxy4.on("load", function(event) {
        console.log(CONSOLE_COLOR.GREEN + "\n  fileScheme: " + fileScheme + "\n" + CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + CONSOLE_COLOR.CLEAR);

        task.set("fileScheme", this.responseText);
        task.pass();
    });
    proxy4.on("error", function() {
        debugger;
        console.log("Error Proxy4");
        task.miss();
    });
    proxy4.open("GET", fileScheme);
    proxy4.send();
}


})((this || 0).self || global);

