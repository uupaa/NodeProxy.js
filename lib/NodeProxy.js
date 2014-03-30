// @name: NodeProxy.js
// @require: Valid.js

(function(global) {
"use strict";

// --- variable --------------------------------------------
//{@assert
var Valid = global["Valid"] || require("uupaa.valid.js");
//}@assert
var ByteArray = global["ByteArray"] || require("uupaa.bytearray.js");
var URI       = global["URI"]       || require("uupaa.uri.js");
var http      = require("http");
var fs        = require("fs");

var _inNode = "process" in global;

// --- define ----------------------------------------------
// readyState from http://www.w3.org/TR/XMLHttpRequest/
var READY_STATE_UNSENT    = 0;
var READY_STATE_OPENED    = 1;
var READY_STATE_HEADERS_RECEIVED = 2;
var READY_STATE_LOADING   = 3;
var READY_STATE_DONE      = 4;

// --- interface -------------------------------------------
function NodeProxy() { // @help: NodeProxy
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

    this._lastReadyState = READY_STATE_UNSENT;
    this._attachedEvents = {}; // { eventType: callback, ... }

    Object.defineProperties(this, {
        "readyState":       { "get": getReadyState },
        "response":         { "get": getResponse },
        "responseText":     { "get": getResponseText },
        "responseType":     { "get": getResponseType,
                              "set": setResponseType },
        "responseXML":      { "get": getResponseXML },
        "status":           { "get": getStatus },
        "statusText":       { "get": getStatusText },
        "upload":           { "get": getUpload,
                              "set": setUpload },
        "withCredentials":  { "get": getWithCredentials,
                              "set": setWithCredentials }
    });
}

NodeProxy["name"] = "NodeProxy";
NodeProxy["repository"] = "https://github.com/uupaa/NodeProxy.js";
NodeProxy["prototype"] = {
    "constructor":          NodeProxy,
    "get":                  NodeProxy_get,                  // NodeProxy#get(url:URLString, callback:Function):this
//  "abort":                NodeProxy_abort,                // NodeProxy#abort():void
    "getAllResponseHeaders":NodeProxy_getAllResponseHeaders,// NodeProxy#getAllResponseHeaders():String
    "getResponseHeader":    NodeProxy_getResponseHeader,    // NodeProxy#getResponseHeader(name:String):String
    "open":                 NodeProxy_open,                 // NodeProxy#open(method:String, url:URLString, async:Boolean = true, user:String = "", password:String = ""):void
    "overrideMimeType":     NodeProxy_overrideMimeType,     // NodeProxy#overrideMimeType():void
    "send":                 NodeProxy_send,                 // NodeProxy#send(data:Any = null):void
    "setRequestHeader":     NodeProxy_setRequestHeader,     // NodeProxy#setRequestHeader():void
    "addEventListener":     NodeProxy_addEventListener,     // NodeProxy#addEventListener(eventType:String, callback:Function):Boolean
    "removeEventListener":  NodeProxy_removeEventListener,  // NodeProxy#removeEventListener(eventType:String, callback:Function):Boolean
    "clearEventListener":   NodeProxy_clearEventListener,   // NodeProxy#clearEventListener():Boolean
    "on":                   NodeProxy_addEventListener,     // NodeProxy#on(eventType:String, callback:Function):Boolean
    "off":                  NodeProxy_removeEventListener,  // NodeProxy#off(eventType:String, callback:Function):Boolean
    "handleEvent":          NodeProxy_handleEvent
};

// --- implement -------------------------------------------
function getReadyState()        { return this._xhr.readyState; }
function getResponse()          { return this._xhr.response; }
function getResponseText()      { return this._xhr.responseText; }
function getResponseType()      { return this._xhr.responseType; }
function setResponseType(v)     {        this._xhr.responseType = v; }
function getResponseXML()       { return this._xhr.responseXML; }
function getStatus()            { return this._xhr.status; }
function getStatusText()        { return this._xhr.statusText; }
function getUpload()            { return this._xhr.upload || null; }
function setUpload(v)           {        this._xhr.upload = v; }
function getWithCredentials()   { return this._xhr.withCredentials || false; }
function setWithCredentials(v)  {        this._xhr.withCredentials = v;  }

function NodeProxy_get(url,        // @arg URLString:
                       callback) { // @arg Function: callback(error, responseText, xhr):void
                                   // @ret this:
//{@assert
    _if(!Valid.type(url,      "String") || URI.parse(url).error, "Proxy#get(url)");
    _if(!Valid.type(callback, "Function"),                       "Proxy#get(,callback)");
//}@assert

    var proxy = new NodeProxy();

    proxy["on"]("load", function() {
        if (this["status"] >= 200 && this["status"] < 300) {
            callback(null, this["responseText"], this);
        } else {
            callback(new Error(this["status"]), "", this);
        }
    });
    proxy["open"]("GET", url);
    proxy["send"]();
}

//function NodeProxy_abort() { // @help: NodeProxy#abort
//    this._xhr["abort"]();
//}

function NodeProxy_getAllResponseHeaders() { // @ret String:
                                             // @help: NodeProxy#getAllResponseHeaders
    var headers = this._xhr.responseHeaders;

    return Object.keys(headers).map(function(key) {
                return key + ":" + headers[key];
            }).join("\n");
}

function NodeProxy_getResponseHeader(name) { // @arg String:
                                             // @ret String:
                                             // @help: NodeProxy#getResponseHeader
    return this._xhr.responseHeaders[name];
}

function NodeProxy_open(method,     // @arg String: "GET" or "POST", ...
                        url,        // @arg URLString:
                        async,      // @arg Boolean(= true):
                        user,       // @arg String(= ""):
                        password) { // @arg String(= ""):
                                    // @help: NodeProxy#open
    async = async === undefined ? true : async;

//{@assert
    _if(this._xhr.readyState !== READY_STATE_UNSENT, "NodeProxy#open() sequence error");
    _if(!Valid.type(method, "String")  || !/^(GET|POST)$/.test(method), "NodeProxy#open(method)");
    _if(!Valid.type(url,    "String")  || URI.parse(url).error, "NodeProxy#open(,url)");
    _if(!Valid.type(async,  "Boolean/omit"), "NodeProxy#open(,,async)");
    _if(!Valid.type(user,   "String/omit"),  "NodeProxy#open(,,,user)");
    _if(!Valid.type(password, "String/omit"), "NodeProxy#open(,,,,password)");
//}@assert

//  this._xhr["open"](method, url, async, user, password);
    this._xhr.method = method;
    this._xhr.url    = url;
    this._xhr.async  = async;
    this._xhr.auth   = user && password ? (user + ":" + password) : "";

    if (this._xhr.readyState === READY_STATE_UNSENT) {
        this._xhr.readyState = READY_STATE_OPENED;
        this._xhr.status = 0;
        this._xhr.responseText = "";

        _call(this, "readystatechange", {});
    }
}

function NodeProxy_overrideMimeType(mimeType) { // @arg String:
                                                // @help: NodeProxy#overrideMimeType
//  this._xhr["overrideMimeType"](mimeType);
}

function NodeProxy_send(data) { // @arg Any(= null): POST request body
                                // @help: NodeProxy#send
//{@assert
    _if(this._xhr.readyState !== READY_STATE_OPENED, "NodeProxy#send() sequence error");
    _if(!Valid.type(data, "undefined"), "NodeProxy#send(data) not implemented");
//}@assert

    if (this._xhr.readyState !== READY_STATE_OPENED) {
        return;
    }

    var uri = URI.parse(this._xhr.url);
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
    http.get(options, function(response) {
        response.setEncoding("utf8");

        that.handleEvent({});

        // sequence --------------------------------------
        that._xhr.readyState = READY_STATE_HEADERS_RECEIVED;
        that._xhr.responseHeaders = response.headers;
        that._xhr.status = response.statusCode;
        that.handleEvent({});

        // sequence --------------------------------------
        that._xhr.readyState = READY_STATE_LOADING;
        that.handleEvent({});

        response.on("data", function(chunk) {
            that._xhr.responseText += chunk;
            that.handleEvent({});
        });
        // sequence --------------------------------------
        response.on("end", function() {
            that._xhr.readyState = READY_STATE_DONE;

            that.handleEvent({});
        });
    }).on("error", function(error) {
        that._xhr.readyState = READY_STATE_DONE;
        that._xhr.statusText = error.message;
        that._xhr.status = 400;

        that.handleEvent({});
        _call(that, "error", {});
    });
}

function _localFile(that, file) {
    if ( !fs.existsSync(file) ) {
        _error(404);
    } else {
        fs.readFile(file, { "encoding": "utf8" }, function(err, data) {
            if (err) {
                _error(400);
            } else {
                that.handleEvent({});

                // sequence --------------------------------------
                that._xhr.readyState = READY_STATE_HEADERS_RECEIVED;
                that._xhr.responseHeaders = {};
                that._xhr.status = 200;
                that.handleEvent({});

                // sequence --------------------------------------
                that._xhr.readyState = READY_STATE_LOADING;
                that.handleEvent({});

                that._xhr.responseText = data;

                // sequence --------------------------------------
                that._xhr.readyState = READY_STATE_DONE;

                that.handleEvent({});
            }
        });
    }

    function _error(status) {
        that._xhr.readyState = READY_STATE_DONE;
        that._xhr.status = status || 400;

        that.handleEvent({});
        _call(that, "error", {});
    }
}

function NodeProxy_setRequestHeader(name,    // @arg String: header name
                                    value) { // @arg String: header value
                                             // @help: NodeProxy#setRequestHeader
    name = name.toLowerCase();
    this._xhr.requestHeader[name] = value;
}

function NodeProxy_addEventListener(eventType,  // @arg EventTypeString: "readystatechange"
                                    callback) { // @arg Function:
                                                // @help: NodeProxy#addEventListener
    if (eventType in this._attachedEvents) {
        return false;
    }
    this._attachedEvents[eventType] = callback;

    return true;
}

function NodeProxy_removeEventListener(eventType,  // @arg EventTypeString: "readystatechange"
                                       callback) { // @arg Function:
                                                   // @help: NodeProxy#removeEventListener
    if (eventType in this._attachedEvents) {
        return false;
    }
    delete this._attachedEvents[eventType];

    return true;
}

function NodeProxy_clearEventListener() { // @help: NodeProxy#clearEventListener
    var eventTypes = Object.keys(this._attachedEvents);

    if (!eventTypes.length) {
        return false;
    }
    this._attachedEvents = {};
    return true;
}

function NodeProxy_handleEvent(event) { // hook readystatechange event
    if (this._xhr.readyState === READY_STATE_DONE) {
        switch (this._xhr.status) {
        case 200:
        case 201:
            this._xhr.response = _createResponseValue(this._xhr);
            break;
        }
    }

    if (this._lastReadyState !== this._xhr.readyState) {
        this._lastReadyState = this._xhr.readyState;
        _call(this, "readystatechange", event);
    }

    switch (this._xhr.readyState) {
    case READY_STATE_OPENED:
        _call(this, "loadstart", event);
        break;

    case READY_STATE_HEADERS_RECEIVED:
        _call(this, "progress", event);
        break;

    case READY_STATE_LOADING:
        _call(this, "progress", event);
        break;

    case READY_STATE_DONE:
        if (this._xhr.status >= 200 && this._xhr.status < 300) {
            _call(this, "load", event);
        }
        _call(this, "loadend", event);
    }
}

function _call(that, type, event) {
    if (that._attachedEvents[type]) {
        that._attachedEvents[type].call(that._xhr, { type: type });
    }
}

function _createResponseValue(xhr) {
    var text = xhr["responseText"];
  //var body = null;
    var result = null;

    switch (xhr["responseType"]) {
    case "arraybuffer":
    case "blob":
        result = ByteArray["fromString"](text);
        break;
    case "document":
        //if ("document" in global) {
        //    body = document.createElement("body");
        //    body["innerHTML"] = text;
        //    result = body;
        //}
        break;
    case "json":
        result = JSON.parse(text);
        break;
    case "text":
    default:
        result = text;
    }
    return result;
}

//{@assert
function _if(value, msg) {
    if (value) {
        console.error(Valid.stack(msg));
        throw new Error(msg);
    }
}
//}@assert

// --- export ----------------------------------------------
//{@node
if (_inNode) {
    module["exports"] = NodeProxy;
}
//}@node
if (global["NodeProxy"]) {
    global["NodeProxy_"] = NodeProxy; // already exsists
} else {
    global["NodeProxy"]  = NodeProxy;
}

})((this || 0).self || global);
