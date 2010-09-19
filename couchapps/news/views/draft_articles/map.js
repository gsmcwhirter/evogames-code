function(doc) {
    if (doc.type == "article" && !doc.status.published)
    {
        emit(doc.status.date, 1);
    }
}
