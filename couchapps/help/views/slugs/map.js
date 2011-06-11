function (doc){
    if (doc.type == "help-question")
    {
        emit(doc.slug.toLowerCase(), 1);
    }
}
