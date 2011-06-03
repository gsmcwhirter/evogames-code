var base = require('../../base'),
    json_schema = require('../../json-schema'),
    event_schema = require('./schema').event;

var app = module.exports = base.createServer();

var _base = "/:code/event";

app.get(_base, eventDirectory);

app.get(_base+"/create", createForm);
app.post(_base+"/create", createProcess);

app.get(_base+"/:slug", displayEvent);

app.get(_base+"/:slug/register", base.auth.loginCheck, registerForm);
app.post(_base+"/:slug/register", base.auth.loginCheck, registerProcess);

app.get(_base+"/:slug/stats", displayStats);
app.get(_base+"/:slug/matches", displayMatchList);

app.get(_base+"/:slug/matches/submit", base.auth.loginCheck, submitMatchForm);
app.post(_base+"/:slug/matches/submit", base.auth.loginCheck, submitMatchProcess);

app.get(_base+"/:slug/matches/:matchid", displayMatch);
app.del(_base+"/:slug/matches/:matchid/dispute", base.auth.loginCheckAjax, disputeMatch);

app.get(_base+"/:slug/controls", base.auth.loginCheck, eventControls);
app.get(_base+"/:slug/controls/edit", base.auth.loginCheck, editForm);
app.post(_base+"/:slug/controls/edit", base.auth.loginCheck, editProcess);

app.del(_base+"/:slug/controls/delete", base.auth.loginCheckAjax, deleteEvent);

app.get(_base+"/:slug/controls/invite", base.auth.loginCheck, inviteForm);
app.put(_base+"/:slug/controls/invite/add", base.auth.loginCheckAjax, addInvite);
app.del(_base+"/:slug/controls/invite/withdraw/:invite", base.auth.loginCheckAjax, withdrawInvite);

app.get(_base+"/:slug/controls/request", base.auth.loginCheck, requestForm);
app.del(_base+"/:slug/controls/request/approve/:request", base.auth.loginCheckAjax, approveRequest);
app.del(_base+"/:slug/controls/request/deny/:request", base.auth.loginCheckAjax, denyRequest);

app.get(_base+"/:slug/controls/admin", base.auth.loginCheck, adminForm);
app.put(_base+"/:slug/controls/admin/add", base.auth.loginCheckAjax, addAdmin);
app.del(_base+"/:slug/controls/admin/remove/:admin", base.auth.loginCheckAjax, removeAdmin);

app.get(_base+"/:slug/controls/disputes", base.auth.loginCheckAjax, disputeList);
app.get(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, editMatchForm);
app.post(_base+"/:slug/controls/disputes/:matchid/edit", base.auth.loginCheck, editMatchProcess);
app.del(_base+"/:slug/controls/disputes/:matchid/delete", base.auth.loginCheckAjax, deleteMatch);

app.param('slug', function (req, res, next, slug){

});

app.param('matchid', function (req, res, next, matchid){

});

app.param('invite', function (req, res, next, invite){

});

app.param('request', function (req, res, next, request){

});

app.param('admin', function (req, res, next, admin){

});

function _isEventAdmin(req){

}

function isEventAdmin(req, res, next){

}

function isEventAdminAjax(req, res, next){

}


//Routes
function eventDirectory(req, res, next){

}

function createForm(req, res, next, locals){

}

function createProcess(req, res, next){
    
}

function displayEvent(req, res, next){

}

function eventControls(req, res, next){
    
}

function registerForm(req, res, next){

}

function registerProcess(req, res, next){
    
}

function editForm(req, res, next){

}

function editProcess(req, res, next){
    
}

function displayStats(req, res, next){

}

function displayMatchList(req, res, next){

}

function displayMatch(req, res, next){

}

function submitMatchForm(req, res, next){

}

function submitMatchProcess(req, res, next){

}

function editMatchForm(req, res, next){

}

function editMatchProcess(req, res, next){
    
}

function disputeMatch(req, res, next){

}

function inviteForm(req, res, next){

}

function addInvite(req, res, next){

}

function withdrawInvite(req, res, next){
    
}

function requestForm(req, res, next){

}

function approveRequest(req, res, next){

}

function denyRequest(req, res, next){

}

function adminForm(req, res, next){

}

function addAdmin(req, res, next){

}

function removeAdmin(req, res, next){
    
}

function deleteMatch(req, res, next){

}

function deleteEvent(req, res, next){
    
}