function (doc){
    if (doc.type == "ticket")
    {
        emit(doc.sorting, 1);
    }
}
