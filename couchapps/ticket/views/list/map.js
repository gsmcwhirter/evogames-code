function (doc){
    if (doc.type == "ticket")
    {
        if (doc.status && doc.status.category && doc.status.category != "closed")
        {
            emit(doc.sorting, 1);
        }
    }
}
