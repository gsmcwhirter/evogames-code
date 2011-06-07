function (doc){
    if (doc.type == "event"){
        if (doc.admins && doc.admins.length){
            doc.admins.forEach(function (admin){
                emit([admin.toLowerCase(), 0, doc.gameid, 0, doc.name.toLowerCase()], {admin: admin, event: doc, _id: doc.gameid});
            });
        }
    }
}