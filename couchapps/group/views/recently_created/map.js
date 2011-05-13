function (doc){
    if (doc.type == "group"){
        emit(doc.created_at, 1);
    }
}