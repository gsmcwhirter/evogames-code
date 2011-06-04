function (doc){
    if (doc.type == "event"){
        emit([doc.game_id, 0, doc.name.toLowerCase()], {event: doc, _id: doc.gameid});
    }
}