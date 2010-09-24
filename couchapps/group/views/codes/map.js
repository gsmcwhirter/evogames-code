function (doc){
    if (doc.type == "group")
    {
        emit([doc.code.toLowerCase(), doc.code], 1);
    }
}
