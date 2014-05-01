var ModuleTest = (function(global) {

var _CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

var _inNode = "process" in global;
var _inWorker = "WorkerLocation" in global;
var _inBrowser = "self" in global;

var test = new Test({
        disable:    false,
        node:       true,
        browser:    false,
        worker:     false,
        button:     true,
        both:       true,
        primary:    global["NodeProxy"],
        secondary:  global["NodeProxy_"],
    });

if (_inBrowser) {
    test.add([ testProxy ]);
} else if (_inNode) {
    test.add([ testNodeProxy ]);
}

return test.run().clone();


function testProxy(next) {
    var href = _inWorker  ? this.href
             : _inBrowser ? location.href : "";

    var task = new Task(3, function(err, buffer) {
            if ( buffer.xhr === buffer.proxy && buffer.proxy === buffer.proxy_get ) {
                console.log("testProxy ok");
                next && next.pass();
            } else {
                console.error("testProxy ng");
                next && next.miss();
            }
        });

    // ----------------------------------------------
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("load", function(event) {
        task.set("xhr", this.responseText);
        task.pass();
    });
    xhr.open("GET", href);
    xhr.send();

    // ----------------------------------------------
    var proxy = new Proxy();

    proxy.on("load", function(event) {
        task.set("proxy", this.responseText);
        task.pass();
    });
    proxy.open("GET", href);
    proxy.send();

    // ----------------------------------------------
    var proxy2 = new Proxy();

    proxy2.get(href, function(error, responseText, xhr) {
        task.set("proxy_get", responseText);
        task.pass();
    });
}



function testNodeProxy(next) {
    var absolute = "http://example.com/";
    var relative = "./test/index.html";
    var localFile = process.cwd() + "/test/index.html";
    var fileScheme = "file://" + process.cwd() + "/test/index.html";

    var task = new Task(4, function(err, buffer) {
            if ( buffer.absolute &&
                 buffer.relative &&
                 buffer.localFile &&
                 buffer.fileScheme ) {

                console.log("testProxy ok");
                next && next.pass();
            } else {
                console.error("testProxy ng");
                next && next.miss();
            }
        });


    // ----------------------------------------------
    var proxy = new NodeProxy();

    proxy.on("load", function(event) {
        console.log(_CONSOLE_COLOR.GREEN + "\n  absolute: " + absolute + "\n" + _CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + _CONSOLE_COLOR.CLEAR);

        task.set("absolute", this.responseText);
        task.pass();

      //console.log(proxy.getAllResponseHeaders());
    });
    proxy.on("error", function() {
        task.miss();
    });
    proxy.open("GET", absolute);
    proxy.send();

    // ----------------------------------------------
    var proxy2 = new NodeProxy();

    proxy2.on("load", function(event) {
        console.log(_CONSOLE_COLOR.GREEN + "\n  relative: " + relative + "\n" + _CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + _CONSOLE_COLOR.CLEAR);

        task.set("relative", this.responseText);
        task.pass();
    });
    proxy2.open("GET", relative);
    proxy2.send();


    // ----------------------------------------------
    var proxy3 = new NodeProxy();

    proxy3.on("load", function(event) {
        console.log(_CONSOLE_COLOR.GREEN + "\n  localFile: " + localFile + "\n" + _CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + _CONSOLE_COLOR.CLEAR);

        task.set("localFile", this.responseText);
        task.pass();
    });
    proxy3.open("GET", localFile);
    proxy3.send();

    // ----------------------------------------------
    var proxy4 = new NodeProxy();

    proxy4.on("load", function(event) {
        console.log(_CONSOLE_COLOR.GREEN + "\n  fileScheme: " + fileScheme + "\n" + _CONSOLE_COLOR.YELLOW + this.responseText.slice(0, 20) + _CONSOLE_COLOR.CLEAR);

        task.set("fileScheme", this.responseText);
        task.pass();
    });
    proxy4.open("GET", fileScheme);
    proxy4.send();
}


})((this || 0).self || global);

