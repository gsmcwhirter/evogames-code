function (doc){
    if (doc.type == "group" && doc.invitations && doc.invitations.length){
        doc.invitations.forEach(function (invite){
            emit([invite.handle.toLowerCase(), 0, doc.name], invite);
        });
    }
}