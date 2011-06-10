var sys = require('util');

var NotFound = module.exports.NotFound = function (msg){
    this.name = 'NotFound';
    this.errcode = 1;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(NotFound, Error);

var AccessDenied = module.exports.AccessDenied = function (msg){
    this.name = 'AccessDenied';
    this.errcode = 2;
    
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(AccessDenied, Error);

var LoggedIn = module.exports.LoggedIn = function (msg){
    this.name = 'LoggedIn';
    this.errcode = 3;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(LoggedIn, Error);

var NotLoggedIn = module.exports.NotLoggedIn = function (msg){
    this.name = 'NotLoggedIn';
    this.errcode = 4;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(NotLoggedIn, Error);

var Forbidden = module.exports.Forbidden = function (msg){
    this.name = 'Forbidden';
    this.errcode = 5;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(Forbidden, Error);

var Lockout = module.exports.Lockout = function (msg){
    this.name = 'Lockout';
    this.errcode = 6;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(Lockout, Error);

var SysError = module.exports.SysError = function (msg){
    this.name = "SysError";
    this.errcode = 7;
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);

    if (!this.message) this.message = msg;
}
sys.inherits(Lockout, Error);
