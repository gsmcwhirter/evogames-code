function (doc){
    if (doc.type == "ticket")
    {
        emit([doc.milestone, doc.sorting], {count: 1, _id: doc.milestone, ticket: doc});
    }
}
