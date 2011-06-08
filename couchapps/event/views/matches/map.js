function (doc){
    if (doc.type == 'event-match'){
        emit(doc.created_at, {match: doc, _id: doc.eventid});
    }
}