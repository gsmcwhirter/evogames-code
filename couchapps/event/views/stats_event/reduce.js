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
        newval.groupcode = value.groupcode;
    });

    return newval;
}