function (doc){
    if (doc.type == "event"){
        if (doc.creator){
            emit([doc.creator.toLowerCase(), 0, doc.gameid], {creator: doc.creator});
        }
    }
}