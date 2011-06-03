function (doc){
    if (doc.type == "event"){
        if (doc.creator){
            emit(doc.creator.toLowerCase(), {creator: doc.creator});
        }
    }
}