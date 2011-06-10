function (doc){
    if (doc.type == 'event-match'){
        if (doc.pending_disputes && doc.pending_disputes.length > 0){
            emit([doc.eventid, 0, doc.created_at, doc._id], 1);
        }
    }
}