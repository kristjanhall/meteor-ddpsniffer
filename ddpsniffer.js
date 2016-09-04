import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';

DDPSniffer = class DDPSnifferClass {
  constructor(name) {
    const self = this;
    this.name = name || 'DDPSniffer';

    // placeholder for listener instances
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
    // use the streamer to hook into all incomming messages and evaluate
    // filters to see if there are any callbacks that need to be called
    // ------------------------------------------------------------------------
    DDPPipe._stream.on('message', function(msg) {
      const obj = EJSON.parse(msg);

      for (const id in self._listeners.in) {
        const listener = self._listeners.in[id];
        const { evaluator } = listener;
        let pass = (listener.filters.length === 0);

        // lets make sure that we have a valid array evaluator (i.e. "some"
        // or "every")
        if (!(evaluator in listener.filters)) {
          throw new Error(`DDPSniffer: evaluator ${evaluator} is not valid`);
        }

        pass = listener.filters[evaluator](filter => {
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
    // the client, evaluate filters to see if there are any callbacks that
    // need to be called
    // ------------------------------------------------------------------------
    const DDPNative = DDPPipe._send;
    DDPPipe._send = function(obj) {
      const me = this;

      if (Object.keys(self._listeners.out).length > 0) {
        for (const id in self._listeners.out) {
          const listener = self._listeners.out[id];
          const { evaluator } = listener;
          let pass = (listener.filters.length === 0);

          // TODO: have evaluator (every) optional ("any" for instance)
          pass = listener.filters[evaluator](filter => {
            return (!filter) ? true : filter(obj);
          });

          if (pass) {
            const callher = listener.callback.bind({
              // return the call to the native interface, possibly with an
              // altered object
              pass: function letPass(newObj) {
                DDPNative.call(me, newObj || obj);
              }
            });

            callher(Object.assign({
              sniffer: self.name,
              dir: 'out',

            }, obj));
          } else {
            DDPNative.call(this, obj);
          }
        }
      }  else {
        DDPNative.call(this, obj);
      }
    };
  }

  addListener({ direction, filters, evaluator = 'every' }, callback) {
    if (!callback) {
      throw new Error('DDPSniffer: missing a required callback function');
    }
    if (['every', 'some'].indexOf(evaluator) < 0) {
      throw new Error('DDPSniffer: evaluator must be either "some" or "every"');
    }

    // make sure that filter[s] are an array of filter[s]
    let _filters = [].concat(filters);

    // if no direction is specified then add this listener to both incoming
    // and outgoing messages
    let _direction = (direction) ? [].concat(direction) : ['in', 'out'];
    _direction.forEach(dir => {
      this._listeners[dir][Random.id()] = {
        filters: _filters,
        evaluator,
        callback
      };
    });

    return this;
  }
}
