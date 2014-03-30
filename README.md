
NodeProxy.js
=========

XMLHttpRequest Proxy for Node.js

# Document

- https://github.com/uupaa/NodeProxy.js/wiki/NodeProxy
- https://github.com/uupaa/Proxy.js/wiki/Proxy

# How to use

```js
// for Node.js
var NodeProxy = require("lib/NodeProxy.js");

var proxy = new NodeProxy();

proxy.get("./index.html", function(error, responseText, xhr) {
    console.log(responseText);
});
```

# for Developers

1. Install development dependency tools

    ```sh
    $ brew install closure-compiler
    $ brew install node
    $ npm install -g plato
    ```

2. Clone Repository and Install

    ```sh
    $ git clone git@github.com:uupaa/NodeProxy.js.git
    $ cd NodeProxy.js
    $ npm install
    ```

3. Build and Minify

    `$ npm run build`

4. Test

    `$ npm run test`

5. Lint

    `$ npm run lint`

