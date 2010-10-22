function (doc){
    if (doc.type == "ticket")
    {
        emit([doc.owner, doc.sorting], {count: 1, _id: doc.owner, ticket: doc});
    }
}
