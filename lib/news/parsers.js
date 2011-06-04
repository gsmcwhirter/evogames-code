var base = require("../base");

module.exports = {
    postIdParser: postIdParser,
    slugParser: slugParser
}

function postIdParser(req, res, next, post_id){
    var api = req.app.set('iapi');

    api.getDoc(post_id, function (article){
        if (article && article.type == "article"){
            req.article = article;
            next();
        }
        else {
            next(new base.errors.NotFound());
        }
    });
}

function slugParser(req, res, next, slug){
    var api = req.app.set('iapi');

    api.news.slugs({include_docs: true, key: slug}, function (response){
            if (response.rows && response.rows.length){
                req.article = response.rows[0].doc;
                next();
            }
            else {
                next(new base.errors.NotFound());
            }
    });
}