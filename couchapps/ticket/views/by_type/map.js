function (doc){
    if (doc.type == "ticket"){
        emit([doc.type, doc.sorting], 1);
    }
}
