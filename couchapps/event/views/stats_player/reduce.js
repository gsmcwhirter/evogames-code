function (keys, values, rereduce){
    var newval = {};
    values.forEach(function (value){
        for(var statname in value){
            if (!isNaN(value[statname])){
                if (!newval[statname]) newval[statname] = 0;
                newval[statname] += value[statname];
            }
            else {
                if (!newval[statname]) newval[statname] = {};
                newval[statname] += 1;
            }
        }

        newval.handle = value.handle;
        newval.alias = value.alias;
        newval.gameid = value.gameid;
        newval.gametype = value.gametype;
        newval.games = (newval.games || 0) + (value.games || 0) + 1;
    });

    return newval;
}