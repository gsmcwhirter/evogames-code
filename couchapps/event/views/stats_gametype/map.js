function (doc){
    if (doc.type == "event-match"){
        doc.teams.forEach(function (team){
            team.players.forEach(function (player){
                var stats = {handle: player.handle, alias: player.alias};
                for (var statname in player.stats){
                    if (!isNaN(player.stats[statname])){
                        stats[statname] = player.stats[statname];
                    }
                    else {
                        stats[statname] = {};
                        stats[statname][player.stats[statname]] = 1;
                    }
                }

                stats.games = 1;

                emit([doc.gameid, 0, doc.gametype_name.toLowerCase(), 0, player.handle.toLowerCase(), player.alias.toLowerCase()], stats);
            })
        });
    }
}