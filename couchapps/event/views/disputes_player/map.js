function (doc){
    if (doc.type == 'event-match'){
        if (doc.pending_disputes && doc.pending_disputes.length > 0){
            doc.teams.forEach(function (team){
                team.players.forEach(function (player){
                    emit([player.handle.toLowerCase(), 0, player.alias.toLowerCase(), 0, doc.created_at, doc._id], {match: doc, _id: doc.eventid});
                });
            });
        }
    }
}