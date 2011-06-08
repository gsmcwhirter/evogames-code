function (doc){
    if (doc.type == 'event-match'){
        emit([doc.eventid, 0, doc.created_at, doc._id], 1);
    }
}