function (doc){
    if (doc.type == "game"){
        emit([doc.name.toLowerCase(), doc.name], 1);
    }
}