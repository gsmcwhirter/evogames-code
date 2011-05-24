function (doc){
    if (doc.type == "game"){
        emit([doc.code.toLowerCase(), doc.code], 1);
    }
}