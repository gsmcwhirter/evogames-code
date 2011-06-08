$(function(){
    $(".match-display").each(function (j, match){
        match = $(match);
        
        var proclist = [];
        var _gametype = $.parseJSON($.trim(match.find(".gametype").text()));
        _gametype.statdefs = {};
        (_gametype.stats || []).forEach(function (stat){
            _gametype.statdefs[stat.name.toLowerCase()] = stat;
            if (stat.valtype == "formula"){
                _gametype.statdefs[stat.name.toLowerCase()].statfunc = mathlexer.parseStringRep(stat.valformula);
            }
            else if (stat.valtype == "enum"){
                _gametype.statdefs[stat.name.toLowerCase()].enum_list = _(stat.valdata.split(",")).map(function (opt){return $.trim(opt);});
            }
        });

        _gametype.ratingfunc = mathlexer.parseStringRep(_gametype.ratingformula);

        match.find("li.team").each(function (i, team){
            team = $(team);

            team.find("table.players thead th").each(function (i,o){
                o = $(o);
                var proc = {};
                proc.index = i;
                proc.name = o.attr("title");

                if (o.hasClass("stat-head") && (o.hasClass("integer") || o.hasClass("float"))){
                    proc.type = "number";
                    proclist.push(proc);
                }
                else if (o.hasClass("stat-head") && o.hasClass("formula")){
                    proc.type = "formula";
                    proclist.push(proc);
                }
                else if (o.hasClass("rating-head")){
                    proc.type = "rating";
                    proclist.push(proc);
                }
            });

            console.log(proclist);

            var stats = {};
            var tfoot_tds = team.find("table.players tfoot tr td");
            var player_trs = team.find("table.players tbody tr.player");

            _(proclist).filter(function (proc){return proc.type == "number"}).forEach(function (proc){
                stats[proc.name] = 0;

                player_trs.each(function (i, row){
                    row = $(row);
                    stats[proc.name] += parseInt(row.find("td").eq(proc.index).text());
                });

                tfoot_tds.eq(proc.index).text(stats[proc.name]);
            });

            _(proclist).filter(function (proc){return proc.type == "formula"}).forEach(function (proc){
                stats[proc.name] = _gametype.statdefs[proc.name.toLowerCase()].statfunc(stats);

                tfoot_tds.eq(proc.index).text(Math.round(stats[proc.name] * 100) / 100);
            });

            _(proclist).filter(function (proc){return proc.type == "rating"}).forEach(function (proc){
                tfoot_tds.eq(proc.index).text(Math.round(_gametype.ratingfunc(stats) * 100) / 100);
            });
        });

    });
});