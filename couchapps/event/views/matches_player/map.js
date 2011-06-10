function (doc){
    if (doc.type == 'event-match'){
        doc.teams.forEach(function (team){
            team.players.forEach(function (player){
                emit([player.handle.toLowerCase(), 0, player.alias.toLowerCase(), 0, doc.created_at, doc._id], {match: doc, _id: doc.eventid});
            });
        });
    }
}