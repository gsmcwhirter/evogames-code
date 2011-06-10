function (doc){
    if (doc.type == "event"){
        emit([doc.creator.toLowerCase(), doc.enddate ? doc.enddate : "N", 0, doc.startdate], {event: doc, _id: doc.gameid, admintype: "creator"});
        (doc.admins || []).forEach(function (admin){
            emit([admin.toLowerCase(), doc.enddate ? doc.enddate : "N", 0, doc.startdate], {event: doc, _id: doc.gameid, admintype: "admin"});
        });
    }
}