function (doc){
    if (doc.type == "ticket" && doc.tags && doc.tags.length)
    {
        doc.tags.forEach(function (tag){
            emit([tag, doc.sorting], 1);
        });
    }
}
