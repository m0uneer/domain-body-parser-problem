Object.defineProperty(exports, "__esModule", { value: true });

// tslint:disable-next-line no-require-imports
const domain = require('domain');

/**
 * Patching global promise in response to https://github.com/nodejs/node-v0.x-archive/issues/8648
 */
class PatchedPromise extends Promise {
  constructor(executor) {
    const activeDomain = domain.active;
    executor = activeDomain && activeDomain.bind(executor) || executor;
    // call native Promise constructor
    super(executor);
    const then = this.then;
    this.then = function (onFulfilled, onRejected) {
      if (activeDomain) {
        onFulfilled = onFulfilled && activeDomain.bind(onFulfilled);
        onRejected = onRejected && activeDomain.bind(onRejected);
      }
      return then.call(this, onFulfilled, onRejected);
    };
    const catchy = this['catch'];
    this['catch'] = function (onRejected) {
      if (activeDomain) {
        onRejected = onRejected && activeDomain.bind(onRejected);
      }
      return catchy.call(this, onRejected);
    };
  }
}

Promise = PatchedPromise;

const __awaiter = function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var express = require('express');

var app = express();

app.use(function(req, res, next) {
  let activeDomain = domain.active ? domain.active : domain.create();
  activeDomain.run(() => {
    if (domain.active.trap) {
      throw new Error('Context Leaked!');
    }

    domain.active.trap = {};
    __awaiter(this, void 0, void 0, function* () {
      try {
        yield new Promise(() => {
          throw new Error('test');
        });
      }
      catch (err) {
        next(err);
      }
    });
  });
});

module.exports = app;
