# DDPSniffer #

A very simple client side DDP listener able to take in listeners hooks and message filters.

## Installation

`$ meteor add kristjanhall:ddpsniffer`

### Usage
A sniffer instance is started with a name parameter, the parameter can be
omitted but if given the name will be passed to the callback function.

Listeners can be chained to the constructor, the listeners take an object with
optional "filters", "direction" and "evaluator" keys.

Evaluators are of the type "every" (default) or "some".

Filters can either be passed in as a single filter or array of filters, filter returns are evaluated to a true or false state. Callback are then only called if every/some filters pass.

It's important to note that outgoing listeners have a ```this.pass()``` function that optionally takes in an object. If the ```this.pass()``` function is not called in the listener the message will not be delivered! If an object is passed in as a parameter to ```this.pass(newObject)``` then that object will be the one passed on as the DDP message.

### Examples
Chain listners to constructo
```js
new DDPSniffer({
  name: 'my sniffer name',

}).addListener({
  filters: [
    noPingPong = function(obj) {
      return (['ping', 'pong'].indexOf(obj.msg) < 0);
    },
    justMethodsAndReturns = function(obj) {
      return (['method', 'result'].indexOf(obj.msg) > -1);
    }
  ]
}, function callback(obj) {
  console.log(obj);
  // make sure we let all outgoing messages pass
  if (this.pass) this.pass();
});
```

Without chaining, and only to incoming messages
```js
function mySnifferCallback(obj) {
  console.log(obj);
}
const mySniffer = new DDPSniffer({
  name: 'my sniffer name'
});

mySniffer.addListener({
  filters: function(obj) {
    return (['ping', 'pong'].indexOf(obj.msg) < 0);
  },
  direction: 'in',
}, mySnifferCallback);

```

Use the "some" evaluator for the filters, default is "every"
```js
function mySnifferCallback(obj) {
  const insert = /.*\/insert.*/;
  // do not pass insert methods, i.e. insert will only happen on client but
  // not on server
  if (!(obj.method && insert.test(obj.method))) {
    if (this.pass) this.pass();
  }
}
const mySniffer = new DDPSniffer({
  name: 'my sniffer name'
});

mySniffer.addListener({
  filters: [
    function isMethod(obj) {
      return (obj.msg === 'method');
    },
    function orReturn(obj) {
      return (obj.msg === 'result');
    },
  ],
  evaluator: 'some',
}, mySnifferCallback);

```

Change outgoing messages
```js

const mySniffer = new DDPSniffer({
  name: 'Date inserts'
}).addListener({
  filters: [
    function justMethods(obj) {
      return (obj.msg === "method" && obj.method);
    },
    function justInserts(obj) {
      const insert = /.*\/insert.*/;
      return insert.test(obj.method);
    }
  ],
},
function timestamp(obj) {
  try {
    obj.params[0]['DDPAt'] = new Date().toISOString();
    this.pass(obj);

  } catch (e) { /* DAMNIT! YOU HAD ONE JOB... */};
});

```
