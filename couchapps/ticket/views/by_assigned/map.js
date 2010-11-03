function (doc){
    if (doc.type == "ticket")
    {
        if (doc.assigned_to && doc.assigned_to.length)
        {
            doc.assigned_to.forEach(function (item){
                emit([item, 0, doc.sorting, doc._id, 0], {count: 1, _id: doc.owner, ticket: doc});
                doc.assigned_to.forEach(function (assigned){
                    emit([item, 0, doc.sorting, doc._id, 1], {count: 0, _id: assigned});
                });
            });
        }
    }
}
