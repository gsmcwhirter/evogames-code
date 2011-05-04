var sys = require('util');

var NotFound = module.exports.NotFound = function (msg){
    this.name = 'NotFound';
    this.errcode = 1;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
sys.inherits(NotFound, Error);

var AccessDenied = module.exports.AccessDenied = function (msg){
    this.name = 'AccessDenied';
    this.errcode = 2;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
sys.inherits(AccessDenied, Error);

var LoggedIn = module.exports.LoggedIn = function (msg){
    this.name = 'LoggedIn';
    this.errcode = 3;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
sys.inherits(LoggedIn, Error);

var NotLoggedIn = module.exports.NotLoggedIn = function (msg){
    this.name = 'NotLoggedIn';
    this.errcode = 4;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
sys.inherits(NotLoggedIn, Error);
