# DDPSniffer #

A very simple DDP listner class able to take in listeners hooks and message
filters.

## Installation

`$ meteor add kristjanhall:ddpsniffer`

### Usage
A sniffer instance is started with a name parameter, the parameter can be
omitted but if given the name will be passed to the callback function.

Listeners can be chained to the constructor, the listeners take an object with
optional "filters" and "direction" keys.

Filters can either be passed in as an array of filters - * note that the order
of filters matters * - filter returns are evaluted to true or false state,
callback are only be called if all filters pass.

```js
new DDPSniffer({
  name: 'my sniffer name',

}).addListener({
  filters: [
    noPingPong = function(obj) {
      return (['ping', 'pong'].indexOf(obj.msg) < -1);
    },
    justMethodsAndReturns = function(obj) {
      return (['method', 'result'].indexOf(obj.msg) > -1);
    }
  ]
}, callback = function(obj) {
  console.log(obj);
});
```

```js
function mySnifferCallback(obj) {
  console.log(obj);
}
const mySniffer = new DDPSniffer({
  name: 'my sniffer name'
});

mySniffer.addListener({
  filters: function(obj) {
    return (['ping', 'pong'].indexOf(obj.msg) < -1);
  },
  direction: 'in',
}, mySnifferCallback);

```
