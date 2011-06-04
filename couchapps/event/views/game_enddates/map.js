function (doc){
    if (doc.type == "event"){
        emit([doc.gameid, doc.enddate, 0, -1 * (new Date(doc.startdate)).getTime()], {event: doc, _id: doc.gameid});
    }
}