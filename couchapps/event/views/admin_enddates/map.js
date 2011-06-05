function (doc){
    if (doc.type == "event"){
        emit([doc.creator.toLowerCase(), -1 * (new Date(doc.enddate)).getTime(), 0, doc.startdate], {event: doc, _id: doc.gameid, admintype: "creator"});
        (doc.admins || []).forEach(function (admin){
            emit([admin.toLowerCase(), -1 * (new Date(doc.enddate)).getTime(), 0, doc.startdate], {event: doc, _id: doc.gameid, admintype: "admin"});
        });
    }
}