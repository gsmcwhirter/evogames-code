var http = require('http');

http.ServerResponse.prototype.redirectMeTo = function (loc, status)
{
    status = status || 303;
    
    this.header("Location", loc);
    var self = this;
    this.render('errors/redirect', {layout: false, locals: {loc: loc}}, function (err, str){
        self.send(str, status);
    });
};
