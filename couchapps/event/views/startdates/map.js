function (doc){
    if (doc.type == "event"){
        emit([-1 * (new Date(doc.startdate)).getTime(), doc.enddate], {event: doc, _id: doc.gameid});
    }
}