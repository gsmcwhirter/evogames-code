$(function(){
    $(".stats-display").each(function (j, statsd){
        statsd = $(statsd);

        function do_search(){
            var string = $(this).val().toLowerCase();
            var exact = false;

            if (string === '') {
                statsd.find("table tbody tr").show();
            } else {
                if (string[0] == ":"){
                    string = string.substring(1);
                    exact = true;
                }

                statsd.find("table tbody tr").hide().each(function (){
                    var row = $(this);

                    var col1 = row.find("td").eq(1);
                    var col2 = row.find("td").eq(2);
                    if (col1.attr("colspan") == "2"){
                        if (exact && col1.text().toLowerCase() == string){
                            row.show();
                        }
                        else if (!exact && col1.text().toLowerCase().indexOf(string) > -1) {
                            row.show();
                        }
                        else {
                            row.hide();
                        }
                    }
                    else {
                        if (exact && (col1.text().toLowerCase() == string || col2.text().toLowerCase() == string)){
                            row.show();
                        }
                        else if (!exact && (col1.text().toLowerCase().indexOf(string) > -1 || col2.text().toLowerCase().indexOf(string) > -1)) {
                            row.show();
                        }
                        else {
                            row.hide();
                        }
                    }
                });

            }
        }

        statsd.find(".search").bind("keyup", do_search)
                              .bind("change", do_search)
                              .bind("click", do_search);

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
            else if (o.hasClass("hidden-stat-head")){
                proc.type = "hidden";
                proclist.push(proc);
            }
        });

        var stats = {
            games: parseInt($("#total_games").text())
        };

        var tfoot_tds = statsd.find("table tfoot tr td");
        var player_trs = statsd.find("table tbody tr");

        var mod = 1;
        if (player_trs.find("td").eq(1).attr("colspan") == "2"){
            mod = 0;
        }

        _(proclist).filter(function (proc){return proc.type == "hidden"}).forEach(function (proc){
            var lstatname = proc.name.toLowerCase();
            stats[lstatname] = 0;

            player_trs.each(function (i, row){
                row = $(row);
                stats[lstatname] += parseFloat(row.find("td").eq(proc.index).text());
            });
        });

        _(proclist).filter(function (proc){return proc.type == "number"}).forEach(function (proc){
            var lstatname = proc.name.toLowerCase();
            stats[lstatname] = 0;

            player_trs.each(function (i, row){
                row = $(row);
                stats[lstatname] += parseFloat(row.find("td").eq(proc.index).text());
            });

            tfoot_tds.eq(proc.index - mod).text(stats[lstatname]);
        });

        _(proclist).filter(function (proc){return proc.type == "formula"}).forEach(function (proc){
            var lstatname = proc.name.toLowerCase();
            stats[lstatname] = _gametype.statdefs[lstatname].statfunc(stats);

            tfoot_tds.eq(proc.index - mod).text(stats[lstatname].toFixed(2));
        });
    });

});