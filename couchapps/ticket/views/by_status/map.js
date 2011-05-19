function (doc){
    if (doc.type == "ticket")
    {
        emit([doc.status, 0, doc.sorting, doc._id, 0], {count: 1, _id: doc.owner, ticket: doc});
        if (doc.assigned_to && doc.assigned_to.length)
        {
            doc.assigned_to.forEach(function (assigned){
                emit([doc.status, 0, doc.sorting, doc._id, 1], {count: 0, _id: assigned});
            });
        }
    }
}
