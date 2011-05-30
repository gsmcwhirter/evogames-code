function (doc){
    if (doc.type == "group")
    {
        emit(doc.code.toLowerCase(), {code: doc.code, name: doc.name});
    }
}
