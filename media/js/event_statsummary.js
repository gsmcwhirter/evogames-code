$(function(){
    $(".stats-display").each(function (j, statsd){
        statsd = $(statsd);

        statsd.find("table").tablesorter({
            sortList: [[0, 0]]
        });
        
        var proclist = [];
        var _gametype = $.parseJSON($.trim(statsd.find(".gametype").text()));
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


        statsd.find("table thead th").each(function (i,o){
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

        var stats = {};

        var tfoot_tds = statsd.find("table tfoot tr td");
        var player_trs = statsd.find("table tbody tr");

        var mod = 1;
        if (tfoot_tds.eq(0).attr("colspan") == "3"){
            mod = 2;
        }

        _(proclist).filter(function (proc){return proc.type == "number"}).forEach(function (proc){
            var lstatname = proc.name.toLowerCase();
            stats[lstatname] = 0;

            player_trs.each(function (i, row){
                row = $(row);
                stats[lstatname] += parseInt(row.find("td").eq(proc.index).text());
            });

            tfoot_tds.eq(proc.index - mod).text(stats[lstatname]);
        });

        _(proclist).filter(function (proc){return proc.type == "formula"}).forEach(function (proc){
            var lstatname = proc.name.toLowerCase();
            stats[lstatname] = _gametype.statdefs[lstatname].statfunc(stats);

            tfoot_tds.eq(proc.index - mod).text(stats[lstatname].toFixed(2));
        });

        _(proclist).filter(function (proc){return proc.type == "rating"}).forEach(function (proc){
            tfoot_tds.eq(proc.index - mod).text(_gametype.ratingfunc(stats).toFixed(2));
        });
    });

});