(function(global) {
"use strict";

// --- dependency module -----------------------------------
//{@dev
//  This code block will be removed in `$ npm run build-release`. http://git.io/Minify
var Valid = global["Valid"] || require("uupaa.valid.js"); // http://git.io/Valid
//}@dev

var EventListener = global["EventListener"] || require("uupaa.eventlistener.js");
var DataType      = global["DataType"]      || require("uupaa.datatype.js");
var URI           = global["URI"]           || require("uupaa.uri.js");
var http          = require("http");
var fs            = require("fs");

// --- local variable --------------------------------------
//var _runOnNode = "process" in global;
//var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

// --- define ----------------------------------------------
// readyState code -> http://www.w3.org/TR/XMLHttpRequest/
var READY_STATE_UNSENT           = 0;
var READY_STATE_OPENED           = 1;
var READY_STATE_HEADERS_RECEIVED = 2;
var READY_STATE_LOADING          = 3;
var READY_STATE_DONE             = 4;

// --- interface -------------------------------------------
function NodeProxy() {
    this._event = new EventListener().types(
        "loadstart,load,loadend,progress,readystatechange,error,timeout".split(","));

    this._xhr = {
        readyState:     READY_STATE_UNSENT,
        // --- request ---
        method:         "",     // "GET" or "POST"
        url:            "",
        async:          true,
        auth:           "",     // "" or "user:password"
        requestHeader:  {},     // { header: value, ... }
        // --- response ---
        response:       null,
        responseText:   "",
        responseXML:    null,
        responseHeaders:{},     // { header: value, ... }
        status:         0,
        statusText:     "",
        upload:         null,
        withCredentials:false
    };
    this._lastURL = "";
    this._lastReadyState = READY_STATE_UNSENT;

    // setup getter and setter.
    Object.defineProperties(this, {
        "readyState":     { "get": getReadyState                                },
        "response":       { "get": getResponse                                  },
        "responseText":   { "get": getResponseText                              },
        "responseType":   { "get": getResponseType,   "set": setResponseType    },
        "responseXML":    { "get": getResponseXML                               },
        "status":         { "get": getStatus                                    },
        "statusText":     { "get": getStatusText                                },
        "upload":         { "get": getUpload,         "set": setUpload          },
        "withCredentials":{ "get": getWithCredentials,"set": setWithCredentials }
    });
}

NodeProxy["repository"] = "https://github.com/uupaa/NodeProxy.js";
NodeProxy["prototype"] = {
    "constructor":          NodeProxy,
    "get":                  NodeProxy_get,                  // NodeProxy#get(url:URLString, callback:Function):this
//  "abort":                NodeProxy_abort,                // NodeProxy#abort():void
    "getAllResponseHeaders":NodeProxy_getAllResponseHeaders,// NodeProxy#getAllResponseHeaders():String
    "getResponseHeader":    NodeProxy_getResponseHeader,    // NodeProxy#getResponseHeader(name:String):String
    "open":                 NodeProxy_open,                 // NodeProxy#open(method:String, url:URLString, async:Boolean = true,
                                                            //                user:String = "", password:String = ""):void
    "overrideMimeType":     NodeProxy_overrideMimeType,     // NodeProxy#overrideMimeType():void
    "send":                 NodeProxy_send,                 // NodeProxy#send(data:Any = null):void
    "setRequestHeader":     NodeProxy_setRequestHeader,     // NodeProxy#setRequestHeader():void
    "addEventListener":     NodeProxy_addEventListener,     // NodeProxy#addEventListener(type:EventTypeString, callback:Function):this
    "removeEventListener":  NodeProxy_removeEventListener,  // NodeProxy#removeEventListener(type:EventTypeString, callback:Function):this
    "clearEventListener":   NodeProxy_clearEventListener,   // NodeProxy#clearEventListener():this
    "on":                   NodeProxy_addEventListener,     // NodeProxy#on(type:EventTypeString, callback:Function):Boolean
    "off":                  NodeProxy_removeEventListener,  // NodeProxy#off(type:EventTypeString, callback:Function):Boolean
    "level":                NodeProxy_level,                // NodeProxy#level():Number
    "convert":              NodeProxy_convert,              // NodeProxy#convert():Any
    // --- internal ---
    "handleEvent":          NodeProxy_handleEvent
};

// --- implement -------------------------------------------
function getReadyState()        { return this._xhr["readyState"]; }
function getResponse()          { return this._xhr["response"]; }
function getResponseText()      { return this._xhr["responseText"]; }
function getResponseType()      { return this._xhr["responseType"]; }
function setResponseType(v)     {        this._xhr["responseType"] = v; }
function getResponseXML()       { return this._xhr["responseXML"]; }
function getStatus()            { return this._xhr["status"]; }
function getStatusText()        { return this._xhr["statusText"]; }
function getUpload()            { return this._xhr["upload"] || null; }
function setUpload(v)           {        this._xhr["upload"] = v; }
function getWithCredentials()   { return this._xhr["withCredentials"] || false; }
function setWithCredentials(v)  {        this._xhr["withCredentials"] = v;  }
function NodeProxy_abort()      { this._xhr["abort"](); }
function NodeProxy_level()      { return 1; }

function NodeProxy_get(url,        // @arg URLString
                       callback) { // @arg Function - callback(error, responseText, xhr):void
                                   // @ret this
                                   // @desc convenient method.
//{@dev
    Valid(Valid.type(url,      "String") && !URI.parse(url).error, NodeProxy_get, "url");
    Valid(Valid.type(callback, "Function"),                        NodeProxy_get, "callback");
//}@dev

    var proxy = new NodeProxy();

    proxy["on"]("load", function() {
        if ( _isSuccess(this["status"]) ) {
            callback(null, this["responseText"], this);
        } else {
            callback(new Error(this["status"]), "", this);
        }
    });
    proxy["open"]("GET", url);
    proxy["send"]();

    return this;
}

function NodeProxy_getAllResponseHeaders() { // @ret String
    var headers = this._xhr.responseHeaders;

    return Object.keys(headers).map(function(key) {
                return key + ":" + headers[key];
            }).join("\n");
}

function NodeProxy_getResponseHeader(name) { // @arg String
                                             // @ret String
//{@dev
    Valid(Valid.type(name, "String"), NodeProxy_getResponseHeader, "name");
//}@dev

    return this._xhr.responseHeaders[name];
}

function NodeProxy_open(method,     // @arg String - "GET" or "POST", ...
                        url,        // @arg URLString
                        async,      // @arg Boolean = true
                        user,       // @arg String = ""
                        password) { // @arg String = ""
//{@dev
    Valid(this._xhr.readyState === READY_STATE_UNSENT,   NodeProxy_open, "sequence error");
    Valid(Valid.type(method, "String") && /^(GET|POST)$/.test(method), NodeProxy_open, "method");
    Valid(Valid.type(url,    "String") && !URI.parse(url).error, NodeProxy_open, "url");
    Valid(Valid.type(async,  "Boolean|omit"),            NodeProxy_open, "async");
    Valid(Valid.type(user,   "String|omit"),             NodeProxy_open, "user");
    Valid(Valid.type(password, "String|omit"),           NodeProxy_open, "password");
//}@dev

    async = async === undefined ? true : async;

    this._lastURL = url;
    this._lastReadyState = READY_STATE_UNSENT;
    this._xhr.method = method;
    this._xhr.url    = url;
    this._xhr.async  = async;
    this._xhr.auth   = user && password ? (user + ":" + password) : "";

    if (this._xhr.readyState === READY_STATE_UNSENT) {
        this._xhr.readyState = READY_STATE_OPENED;
        this._xhr.status = 0;
        this._xhr.responseText = "";

        _fireEvent(this, "readystatechange");
    }
}

function NodeProxy_overrideMimeType(mimeType) { // @arg String:
//{@dev
    Valid(Valid.type(mimeType, "String"), NodeProxy_overrideMimeType, "mimeType");
//}@dev

//  this._xhr["overrideMimeType"](mimeType);
}

function NodeProxy_send(data) { // @arg Any = null - POST request body
//{@dev
    Valid(this._xhr.readyState === READY_STATE_OPENED, NodeProxy_send, "sequence error");
    Valid(Valid.type(data, "null|undefined"),          NodeProxy_send, "data");
//}@dev

    var uri = URI["parse"](this._xhr.url);
    var options = {
            host:   uri.host,
            port:   uri.port || 80,
            path:   uri.path,
            auth:   this._xhr.auth || uri.auth || "",
            mehtod: this._xhr.method,
            headers:this._xhr.requestHeader
        };

    if (uri.host) {
        _remoteFile(this, options);
    } else {
        _localFile(this, uri.pathname);
    }
}

function _remoteFile(that, options) {
    http["get"](options, function(response) {
        response["setEncoding"]("utf8");

        that.handleEvent();

        // sequence --------------------------------------
        that._xhr.readyState = READY_STATE_HEADERS_RECEIVED;
        that._xhr.responseHeaders = response["headers"];
        that._xhr.status = response["statusCode"];
        that.handleEvent();

        // sequence --------------------------------------
        that._xhr.readyState = READY_STATE_LOADING;
        that.handleEvent();

        response["on"]("data", function(chunk) {
            that._xhr.responseText += chunk;
            that.handleEvent();
        });
        // sequence --------------------------------------
        response["on"]("end", function() {
            that._xhr.readyState = READY_STATE_DONE;

            that.handleEvent();
        });
    })["on"]("error", function(error) {
        that._xhr.readyState = READY_STATE_DONE;
        that._xhr.statusText = error["message"];
        that._xhr.status = 400;

        that.handleEvent();
        _fireEvent(that, "error");
    });
}

function _localFile(that, file) {
    if ( !fs["existsSync"](file) ) {
        _error(404);
    } else {
        fs["readFile"](file, { "encoding": "utf8" }, function(err, data) {
            if (err) {
                _error(400);
            } else {
                that.handleEvent();

                // sequence --------------------------------------
                that._xhr.readyState = READY_STATE_HEADERS_RECEIVED;
                that._xhr.responseHeaders = {};
                that._xhr.status = 200;
                that.handleEvent();

                // sequence --------------------------------------
                that._xhr.readyState = READY_STATE_LOADING;
                that.handleEvent();

                that._xhr.responseText = data;

                // sequence --------------------------------------
                that._xhr.readyState = READY_STATE_DONE;

                that.handleEvent();
            }
        });
    }

    function _error(status) {
        that._xhr.readyState = READY_STATE_DONE;
        that._xhr.status = status || 400;

        that.handleEvent();
        _fireEvent(that, "error");
    }
}

function NodeProxy_setRequestHeader(name,    // @arg String - header name
                                    value) { // @arg String - header value
//{@dev
    Valid(Valid.type(name,  "String"), NodeProxy_setRequestHeader, "name");
    Valid(Valid.type(value, "String"), NodeProxy_setRequestHeader, "value");
//}@dev

    name = name.toLowerCase();
    this._xhr.requestHeader[name] = value;
}

function NodeProxy_addEventListener(type,       // @arg EventTypeString - "readystatechange"
                                    callback) { // @arg Function
                                                // @ret this
    this._event["add"](null, type, callback);
    return this;
}

function NodeProxy_removeEventListener(type,       // @arg EventTypeString - "readystatechange"
                                       callback) { // @arg Function
                                                   // @ret this
    this._event["remove"](null, type, callback);
    return this;
}

function NodeProxy_clearEventListener() { // @ret this
    this._event["clear"](null);
    return this;
}

function NodeProxy_handleEvent(event) { // @arg EventObject|null

    var xhr = this._xhr;
    var status = xhr["status"];
    var readyState = xhr["readyState"];

    if (this._lastReadyState !== readyState) {
        this._lastReadyState = readyState;
        _fireEvent(this, "readystatechange", event);
    }

    switch (readyState) {
    case READY_STATE_OPENED:
        _fireEvent(this, "loadstart", event);
        break;
    case READY_STATE_HEADERS_RECEIVED:
    case READY_STATE_LOADING:
        _fireEvent(this, "progress", event);
        break;
    case READY_STATE_DONE:
        if ( _isSuccess(status) ) {
            try {
                xhr.response = _convertDataType(xhr["responseText"],
                                                xhr["responseType"]);
            } catch (o_O) {
            }
            _fireEvent(this, "load", event);
        }
        _fireEvent(this, "loadend", event);
    }
}

function NodeProxy_convert() { // @ret Any
    var xhr = this._xhr;
    var status = xhr["status"];
    var readyState = xhr["readyState"];

    if (readyState === READY_STATE_DONE) {
        if ( _isSuccess(status) ) {
            return _convertDataType(xhr["responseText"],
                                    xhr["responseType"]);
        }
    }
    return "";
}

function _convertDataType(text, type) {
    switch (type) {
    case "json":    return JSON.parse(text);                      // -> Object
    case "document":return _createHTMLDocument(text);             // -> Document|String
    case "arraybuffer":
    case "blob":    return DataType["Array"]["fromString"](text); // -> ByteArray
    }
    return text;
}

function _createHTMLDocument(text) {
    if (_runOnBrowser) {
        var body = document.createElement("body");

        body["innerHTML"] = text;
        return body;
    }
    return text;
}

function _isSuccess(status) { // @arg Integer - HTTP_STATUS_CODE
                              // @ret Boolean
    var ok = status >= 200 && status < 300;

    return ok;
}

function _fireEvent(that,    // @arg this
                    type,    // @arg EventTypeString - "readystatechange", "loadstart", "progress", "load", "error", "loadend"
                    event) { // @arg EventObject - { type, ... }
    event = event || { type: type };

    if ( that._event["has"](type) ) {
        that._event["get"](type).forEach(function(callback) {
            callback.call(that._xhr, event);
        });
    }
}

// --- export ----------------------------------------------
if ("process" in global) {
    module["exports"] = NodeProxy;
}
global["NodeProxy" in global ? "NodeProxy_" : "NodeProxy"] = NodeProxy; // switch module. http://git.io/Minify

})((this || 0).self || global); // WebModule idiom. http://git.io/WebModule

