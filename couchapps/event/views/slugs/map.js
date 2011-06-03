function (doc){
    if (doc.type == "event"){
        emit(doc.slug.toLowerCase(), 1);
    }
}