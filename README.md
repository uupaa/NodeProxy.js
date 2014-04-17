=========
NodeProxy.js
=========

![](https://travis-ci.org/uupaa/NodeProxy.js.png)

XMLHttpRequest Proxy for Node.js

# Document

- [WebModule](https://github.com/uupaa/WebModule) ([Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html))
- [Development](https://github.com/uupaa/WebModule/wiki/Development)
- [NodeProxy.js wiki](https://github.com/uupaa/NodeProxy.js/wiki/NodeProxy)


# How to use

```js
// for Node.js
var NodeProxy = require("lib/NodeProxy.js");

var proxy = new NodeProxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});
```
