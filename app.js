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

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Add this middleware as the first one
app.use(function(req, res, next) {
  let activeDomain = domain.active ? domain.active : domain.create();
  activeDomain.run(() => {
    next();
  });
});

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// And add this middleware here
app.use((req, res, next) => {
  if (domain.active.trap) {
    throw new Error('Context Leaked!');
  }

  domain.active.trap = {};
  next();
});

app.use((req, res, next) => {
  return __awaiter(this, void 0, void 0, function* () {
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

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
