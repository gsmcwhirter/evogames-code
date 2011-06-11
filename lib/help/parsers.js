var base = require("../base");

module.exports = {
    questionIdParser: questionIdParser,
    slugParser: slugParser
}

function questionIdParser(req, res, next, question_id){
    var api = req.app.set('iapi');

    api.getDoc(question_id, function (question){
        if (question && question.type == "help-question"){
            req.question = question;
            next();
        }
        else {
            next(new base.errors.NotFound());
        }
    });
}

function slugParser(req, res, next, slug){
    var api = req.app.set('iapi');

    api.help.slugs({include_docs: true, key: slug}, function (response){
            if (response.rows && response.rows.length){
                req.question = response.rows[0].doc;
                next();
            }
            else {
                next(new base.errors.NotFound());
            }
    });
}