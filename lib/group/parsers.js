var base = require("../base"),
    mw = require("./middleware");

module.exports = {
    codeParser: codeParser
}

function codeParser(req, res, next, code){
    var api = req.app.set('iapi');

    api.groups.codes({include_docs: true, key: code.toLowerCase()}, function (response){
        if (!response.errors && response.rows.length){
            req.group = response.rows[0].doc;
            mw.checkGroupAdmin(req, res, function (err){
                if (err){
                    next(err);
                }
                else {
                    next();
                }
            });
        }
        else {
            req.group = false;
            next(new base.errors.NotFound());
        }
    });
}