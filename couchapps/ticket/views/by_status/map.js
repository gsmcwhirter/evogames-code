function (doc){
    if (doc.type == "ticket")
    {
        emit([doc.status, doc.sorting], 1);
    }
}
