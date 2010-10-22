function (doc){
    if (doc.type == "ticket")
    {
        if (doc.assigned_to && doc.assigned_to.length)
        {
            doc.assigned_to.forEach(function (item){
                emit([item, doc.sorting], {count: 1, _id: item, ticket: doc});
            });
        }
    }
}
