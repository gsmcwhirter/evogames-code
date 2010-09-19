function(doc) {
    if (doc.type == "article")
    {
        emit(doc.status.date, 1);
    }
}
