function (doc){
    if (doc.type == "event-match"){
        doc.teams.forEach(function (team){
            team.players.forEach(function (player){
                var stats = {handle: player.handle, alias: player.alias, groupcode: player.groupcode || false};
                for (var statname in player.stats){
                    if (!isNaN(player.stats[statname])){
                        stats[statname] = player.stats[statname];
                    }
                    else {
                        stats[statname] = {};
                        stats[statname][player.stats[statname]] = 1;
                    }
                }

                emit([doc.eventid, 0, player.handle.toLowerCase(), player.alias.toLowerCase(), (player.groupcode || "").toLowerCase()], stats);
            })
        });
    }
}