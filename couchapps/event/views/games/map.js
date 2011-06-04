function (doc){
    if (doc.type == "event"){
        emit([doc.gameid, 0, doc.name.toLowerCase()], {event: doc, _id: doc.gameid});
    }
}