# NodeProxy.js [![Build Status](https://travis-ci.org/uupaa/NodeProxy.js.png)](http://travis-ci.org/uupaa/NodeProxy.js)

[![npm](https://nodei.co/npm/uupaa.nodeproxy.js.png?downloads=true&stars=true)](https://nodei.co/npm/uupaa.nodeproxy.js/)

XMLHttpRequest Proxy for Node.js

## Document

- [NodeProxy.js wiki](https://github.com/uupaa/NodeProxy.js/wiki/NodeProxy)
- [Development](https://github.com/uupaa/WebModule/wiki/Development)
- [WebModule](https://github.com/uupaa/WebModule)
    - [Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html)
    - [Development](https://github.com/uupaa/WebModule/wiki/Development)

## How to use

### Node.js

```js
var NodeProxy = require("lib/NodeProxy.js");

var proxy = new NodeProxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});
```
