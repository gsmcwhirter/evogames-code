$(function (){
    var matchsub = $.sammy("#match-submission", function (){

        this.use("JSON");

        var _autochange_data;
        var _gametype;

        this.bind("run", function (){
            $("ul.teams").bind("add-team", function (){
                var self = $(this);
                var newTeam = $("ul.teams-template li.team").clone(true);
                newTeam.trigger("add-player");
                newTeam.appendTo(self);
                newTeam.trigger("update-team-rank", [$("li.team", self).length]);

                $("li.team", self).each(function (i,o){
                    $(o).trigger("update-team-num", [i + 1]);
                });
            });

            $("li.team").bind("add-player", function (){
                var self = $(this);
                var newPlayer = $("table.player-template tbody tr").clone(true);
                $("table.players tbody", self).append(newPlayer);
            }).bind("update-team-num", function (e, newnum){
                $(".team-number", $(this)).text(newnum);
            }).bind("update-team-rank", function (e, newnum){
                $("input[name=rank]", $(this)).val(newnum);
            });

            $("tr.player").bind("calc-stats", function (){
                var player = $(this);

                var stats = {};

                player.find("td .stat-input").each(function (i, o){
                    o = $(o);

                    var statname = o.attr("name");
                    if (!stats[statname]){
                        var val;
                        if (o.attr("type") == "number"){
                            val = parseFloat(o.val()) || 0;
                        }
                        else {
                            val = o.val();
                        }

                        stats[statname] = val;
                    }
                    else {
                        throw "duplicate stat name: "+statname;
                    }
                });
                
                player.find("td .stat-value").each(function (i, o){
                    o = $(o);
                    var statname = o.attr("title");

                    if (_gametype.statdefs[statname.toLowerCase()]){
                        var result = _gametype.statdefs[statname.toLowerCase()].statfunc(stats);
                        if (typeof result != "undefined"){
                            o.text(Math.round(result * 100) / 100);
                        }
                        else {
                            o.text("")
                        }
                    }
                    else {
                        throw "extra stat name: "+statname;
                    }
                });

                var rating = _gametype.ratingfunc(stats);

                player.find(".rating").text(Math.round(rating * 100) / 100);
            });

            $("a.add-team").bind("click", function (){
                $("ul.teams").trigger("add-team");
                return false;
            });

            $("a.add-player").bind("click", function (){
                $(this).parents("li.team").first().trigger("add-player");
                return false;
            });

            $("a.remove-team").bind("click", function (){
                alert("Not implemented.");
            });

            $("a.remove-player").bind("click", function (){
                var last = $(this).parents("tbody:first").find("tr.player").length < 2;
                if (last){
                    $(this).parents("li.team:first").trigger("add-player");
                }
                $(this).parents("tr.player:first").remove();

                return false;
            });

            $("select.sel1").bind("change", function (){
                var self = $(this);
                var player = self.parents("tr.player:first");

                var sel2s = _autochange_data.sel1[self.val().toLowerCase()];

                if (typeof sel2s != "undefined"){
                    $("select.sel2 option", player).hide().each(function (i,o){
                        o = $(o);
                        if (o.attr("value") == " " || $.inArray(o.attr("value"), sel2s) > -1){
                            o.show();
                        }
                    });
                }
                else {
                    $("select.sel2 option", player).show();
                }
            });

            $("select.sel2").bind("change", function (){
                var self = $(this);
                var player = self.parents("tr.player:first");

                var sel1s = _autochange_data.sel2[self.val().toLowerCase()];

                if (typeof sel1s != "undefined"){
                    $("select.sel1 option", player).hide().each(function (i,o){
                        o = $(o);
                        if (o.attr("value") == " " || $.inArray(o.attr("value"), sel1s) > -1){
                            o.show();
                        }
                    });
                }
                else {
                    $("select.sel1 option", player).show();
                }
            });

            function _stat_input_change(){
                $(this).parents("tr.player:first").trigger("calc-stats");
            }

            $(".stat-input").bind("change", _stat_input_change)
                            .bind("click", _stat_input_change)
                            .bind("keyup", _stat_input_change)
                            .bind("blur", _stat_input_change);

            var mteams;
            if (typeof MIN_TEAMS != "undefined"){
                mteams = MIN_TEAMS;
            }
            else {
                this.log("MIN_TEAMS undefined");
                mteams = 1;
            }

            var cteams = $("ul.teams li.team").length;
            if (cteams < mteams){
                for (var i = 0, ct = mteams - cteams; i < ct; i++){
                    $("ul.teams").trigger("add-team");
                }
            }

            $("ul.teams li.team").each(function (i, o){
                o = $(o);

                var players = $("table.players tbody tr.player", o);

                if (players.length == 0){
                    o.trigger("add-player");
                }
            });

            var acdt = $.trim($(".autochange_data").text());
            if (acdt){
                _autochange_data = this.json(acdt);
            }
            else {
                this.log("AUTOCHANGE_DATA undefined");
            }

            var gtt = $.trim($(".gametype_data").text());
            if (gtt){
                _gametype = this.json(gtt);

                _gametype.statdefs = {};
                (_gametype.stats || []).forEach(function (stat){
                    _gametype.statdefs[stat.name.toLowerCase()] = stat;
                    _gametype.statdefs[stat.name.toLowerCase()].statfunc = mathlexer.parseStringRep(stat.valformula);
                });

                _gametype.ratingfunc = mathlexer.parseStringRep(_gametype.ratingformula);
            }
            else {
                this.log("GAMETYPE undefined");
            }

            $("tr.player").trigger("calc-stats");
        });

        function noop(){}

        this.get('', noop);
        this.get("#!/", noop);

        this.post("#!/submit", function (){

        });
    });

    matchsub.run();
});