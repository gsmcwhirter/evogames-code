function(doc) {
    if (doc.type == 'player')
    {
        emit([doc.username.toLowerCase(), doc.username], 1);
    }  
}
