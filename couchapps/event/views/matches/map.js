function (doc){
    if (doc.type == 'event-match'){
        emit([doc.created_at, doc._id], {match: doc, _id: doc.eventid});
    }
}