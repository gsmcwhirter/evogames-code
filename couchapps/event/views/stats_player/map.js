function (doc){
    if (doc.type == "event-match"){
        if (doc.gametype_name != "custom"){
            doc.teams.forEach(function (team){
                team.players.forEach(function (player){
                    var gtname = doc.gametype_name.toLowerCase();
                    var stats = {
                        handle: player.handle,
                        alias: player.alias,
                        gameid: doc.gameid,
                        gametype: gtname
                    };

                    for (var statname in player.stats){
                        if (!isNaN(player.stats[statname])){
                            stats[statname] = player.stats[statname];
                        }
                        else {
                            stats[statname] = {};
                            stats[statname][player.stats[statname]] = 1;
                        }
                    }

                    emit([player.handle.toLowerCase(), player.alias.toLowerCase(), 0, doc.gameid, gtname], stats);
                })
            });
        }
    }
}