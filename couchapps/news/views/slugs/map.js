function (doc){
    if (doc.type == "article")
    {
        emit(doc.slug.toLowerCase(), 1);
    }
}
