function (doc){
    if (doc.type == "event"){
        emit([doc.gameid, -1 * (new Date(doc.enddate)).getTime(), 0, doc.startdate], {event: doc, _id: doc.gameid});
    }
}