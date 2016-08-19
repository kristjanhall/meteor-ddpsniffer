import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';

DDPSniffer = class DDPSnifferClass {
  constructor(name) {
    const self = this;
    this.name = name || 'DDPSniffer';

    // placeholder for listner instances
    this._listeners = {
      in: {},
      out: {},
    };

    // pickup a connection instance
    let DDPPipe = Meteor.connection || Meteor.default_connection;
    if (!DDPPipe) {
      throw new Error('DDPSniffer: could not find a DDP interface')
    }

    // incoming traffic
    // use the streamer to hook into all incomming messages, evaluate listener
    // filters to see if there are any callbacks that need to be called
    // ------------------------------------------------------------------------
    DDPPipe._stream.on('message', function(msg) {
      let obj = EJSON.parse(msg);

      for (let id in self._listeners.in) {
        let listener = self._listeners.in[id];
        let pass = (listener.filters.length === 0);

        pass = listener.filters.every(filter => {
          return (!filter) ? true : filter(obj);
        });

        if (pass) {
          listener.callback(Object.assign({
            sniffer: self.name,
            dir: 'in',
          }, obj));
        }
      }
    });

    // outgoing traffic
    // highjack the send interface to plug into all messages being sent from
    // the client, evaluate listener filters to see if there are any
    // callbacks that need to be called
    // ------------------------------------------------------------------------
    let DDPNative = DDPPipe._send;
    DDPPipe._send = function(obj) {
      for (let id in self._listeners.out) {
        let listener = self._listeners.out[id];
        let pass = (listener.filters.length === 0);

        pass = listener.filters.every(filter => {
          return (!filter) ? true : filter(obj);
        });

        if (pass) {
          listener.callback(Object.assign({
            sniffer: self.name,
            dir: 'out',
          }, obj, self));
        }
      }
      // return the call to the native interface
      DDPNative.call(this, obj);
    };
  }

  addListener({ direction, filters }, callback) {
    if (!callback) {
      throw new Error('DDPSniffer: missing a required callback function');
    }

    // make sure that filter[s] are an array of filter[s]
    let _filters = [].concat(filters);

    // if no direction is specified then add this listner to both incoming
    // and outgoing messages
    let _direction = (direction) ? [].concat(direction) : ['in', 'out'];
    _direction.forEach(dir => {
      this._listeners[dir][Random.id()] = {
        filters: _filters,
        callback
      };
    });

    return this;
  }
}
