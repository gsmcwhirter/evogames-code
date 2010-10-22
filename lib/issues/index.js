module.exports.urls = function (_base, ssl){
    if (ssl)
    {
        return function (app){}
    }
    else
    {
        return function (app){
            app.get(_base + "/", indexForm);
        }
    }
}

function indexForm(req, res, next){

}
