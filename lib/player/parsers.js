var base = require("../base");

module.exports = {
    handleParser: handleParser
}

function handleParser(req, res, next, handle){
    var api = req.app.set('iapi');
    handle = decodeURI(handle);

    api.players.handles({include_docs: true, key: handle.toLowerCase()}, function (response){
        if (!response.errors && response.rows.length){
            req.hplayer = response.rows[0].doc;
            next();
        }
        else {
            res.redirect('search');
        }
    });
}