var http = require('http');

http.ServerResponse.prototype.setCookie = function (name, value, expires, path, domain, httponly)
{
    var cstr = name + "=" + value;
    
    if (expires)
    {
        cstr = cstr + "; expires="+expires;
    }
    
    if (path)
    {
        cstr = cstr + "; path="+path;
    }
    
    if (domain)
    {
        cstr = cstr + "; domain="+domain;
    }
    
    if (httponly)
    {
        cstr = cstr + "; HttpOnly";
    }
    
    this.header('Set-Cookie', cstr);
};

http.ServerResponse.prototype.clearCookie = function (name)
{
    var date = new Date();
    date.setDate(date.getDate() - 7);
    this.setCookie(name, '', date.toUTCString());
};

http.ServerResponse.prototype.redirectTo = function (loc, status)
{
    status = status || 303;
    
    this.header("Location", loc);
    var self = this;
    this.render('errors/redirect', {layout: false, locals: {loc: loc}}, function (err, str){
        self.send(str, status);
    });
};
