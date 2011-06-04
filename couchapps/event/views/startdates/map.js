function (doc){
    if (doc.type == "event"){
        emit([doc.startdate, -1 * (new Date(doc.enddate)).getTime()], {event: doc, _id: doc.gameid});
    }
}