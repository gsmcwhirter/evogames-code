function(doc) {
    if (doc.type == "menu")
    {
        if (doc.items.length > 0)
        {
            emit([doc.group, doc.order], 1);
            
            for (var ikey in doc.items)
            {
                emit([doc.group, doc.order, doc.items[ikey].order], 1);
            }
        }
    }
}
