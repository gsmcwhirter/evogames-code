function (doc){
    if (doc.type == "event"){
        emit([doc.gameid, doc.enddate ? doc.enddate : "N", 0, doc.startdate], {event: doc, _id: doc.gameid});
    }
}