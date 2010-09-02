function(doc) {
    if (doc.type == "menu")
    {
        if (doc.items.length > 0)
        {
            emit([doc.group, doc.order], 1);
            
            doc.items.forEach(function(item){
                emit([doc.group, doc.order, item.order], item);
            });
        }
    }
}
