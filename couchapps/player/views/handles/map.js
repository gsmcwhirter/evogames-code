function(doc) {
    if (doc.type == 'player')
    {
        emit([doc.handle.toLowerCase(), doc.handle], 1);
    }  
}
