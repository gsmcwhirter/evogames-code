function (doc){
    if (doc.type == 'event-match'){
        emit([doc.gameid, 0, doc.gametype_name.toLowerCase(), 0, doc.created_at, doc._id], {match: doc, _id: doc.eventid});
    }
}