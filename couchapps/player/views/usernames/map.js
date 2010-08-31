function(doc) {
    if (doc.type == 'player')
    {
        emit([doc._id.toLowerCase(), doc._id], 1);
    }  
}
