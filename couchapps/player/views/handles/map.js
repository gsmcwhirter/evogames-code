function(doc) {
    if (doc.type == 'player')
    {
        emit(doc.handle.toLowerCase(), {handle: doc.handle});
    }  
}
