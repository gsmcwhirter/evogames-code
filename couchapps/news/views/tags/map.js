function(doc) {
    if (doc.type == "article" && doc.status.published && doc.tags && doc.tags.length)
    {
        doc.tags.forEach(function (tag){
            emit(tag, 1);
        });
    }
}
