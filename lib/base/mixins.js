var http = require('http');

http.ServerResponse.prototype.old_redirect = http.ServerResponse.prototype.redirect;

http.ServerResponse.prototype.redirect = function (loc, status)
{
    status = status || 303;

    this.old_redirect(loc, status);
    /*this.header("Location", loc);
    var self = this;
    this.render('errors/redirect', {layout: false, loc: loc}, function (err, str){
        self.send(str, status);
    });*/
};
