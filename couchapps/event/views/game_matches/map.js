function (doc){
    if (doc.type == 'event-match'){
        emit([doc.gameid, 0, doc.created_at], {match: doc, _id: doc.eventid});
    }
}