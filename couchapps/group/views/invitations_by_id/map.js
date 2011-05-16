function (doc){
    if (doc.type == "group" && doc.invitations && doc.invitations.length){
        doc.invitations.forEach(function (invite){
            emit([invite.id, 0, doc.name], invite);
        });
    }
}