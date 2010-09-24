function (doc){
    if (doc.type == "group" && doc.owners && doc.owners.length)
    {
        doc.owners.forEach(function (owner){
            emit(owner, 1);
        });
    }
}
