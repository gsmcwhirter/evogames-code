function (doc){
    if (doc.type == "event"){
        if (doc.invitations && doc.invitations.length){
            doc.invitations.forEach(function (invite){
                emit([invite.id, 0, doc.name.toLowerCase()], {invite: invite, event: doc, _id: doc.gameid});
            });
        }
    }
}