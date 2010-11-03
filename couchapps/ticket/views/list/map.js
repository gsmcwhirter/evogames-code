function (doc){
    if (doc.type == "ticket")
    {
        if (doc.status && doc.status.category && doc.status.category != "closed")
        {
            emit([doc.sorting, doc._id, 0], {count: 1, _id: doc.owner, ticket: doc});
            if (doc.assigned_to && doc.assigned_to.length)
            {
                doc.assigned_to.forEach(function (assigned){
                    emit([doc.sorting, doc._id, 1], {count: 0, _id: assigned});
                });
            }
        }
    }
}
