$(function (){
    var matchedit = $.sammy("#match-edit", function (){

        this.use("JSON");

        var _autochange_data;
        var _gametype;
        var _min_teams = 1;

        this.bind('loaddata', function (){
            var datat = $.trim($(".marshal").text());
            var data = this.json(datat);

            var teamul = $("ul.teams");
            teamul.empty();

            data.teams.forEach(function (team){
                teamul.trigger("add-team");
                var teamli = teamul.find("li.team:last");
                teamli.trigger("update-team-rank", [team.rank]);

                var p1 = team.players.shift();
                teamli.find("tr.player:last").trigger("update-data", [p1]);

                team.players.forEach(function (player){
                    teamli.trigger("add-player");
                    teamli.find("tr.player:last").trigger("update-data", [player]);
                });
            });
        });

        this.bind("run", function (){
            $("ul.teams").bind("add-team", function (){
                var self = $(this);
                var newTeam = $("ul.teams-template li.team").clone(true);
                newTeam.trigger("add-player");
                newTeam.appendTo(self);
                newTeam.trigger("update-team-rank", [$("li.team", self).length]);

                self.trigger("update-team-nums");
            }).bind("check-minimum", function (){
                var self = $(this);
                var cteams = $("li.team", self).length;
                if (cteams < _min_teams){
                    for (var i = 0, ct = _min_teams - cteams; i < ct; i++){
                        self.trigger("add-team");
                    }
                }
                else {
                    self.trigger("update-team-nums");
                }
            }).bind("update-team-nums", function (){
                var self = $(this);

                $("li.team", self).each(function (i,o){
                    $(o).trigger("update-team-num", [i + 1]);
                });

                self.trigger("calc-wlt");
            }).bind("calc-wlt", function (){
                var self = $(this);

                var rankings = _.uniq(_.map(self.find("li.team"), function (team){return $(team).find("input[name=rank]").val()}));

                var rank_wl = {};

                rankings.forEach(function (rank){
                    rank_wl["rank-"+rank] = {
                        wins: _.filter(rankings, function (rank2){return parseInt(rank2) > parseInt(rank)}).length,
                        losses: _.filter(rankings, function (rank2){return parseInt(rank2) < parseInt(rank)}).length
                    }
                });


                self.find("li.team").each(function (i, team){
                    team = $(team);

                    var rank = team.find("input[name=rank]").val();
                    var wltcell = team.find("table.players tfoot td:first");

                    wltcell.find(".record .wins").text(rank_wl["rank-"+rank].wins);
                    wltcell.find(".record .losses").text(rank_wl["rank-"+rank].losses);
                    wltcell.find(".record .ties").text(rankings.length - rank_wl["rank-"+rank].wins - rank_wl["rank-"+rank].losses - 1);

                    team.trigger("calc-summary");
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
            }).bind("remove", function (){
                $(this).remove();
                $("ul.teams").trigger("calc-wlt").trigger("check-minimum");
            }).bind("calc-summary", function (){
                var team = $(this);
                var proclist = [];

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

                var wltcell = team.find("table.players tfoot td:first");

                var stats = {
                    wins: parseInt(wltcell.find(".record .wins").text()),
                    losses: parseInt(wltcell.find(".record .losses").text()),
                    ties: parseInt(wltcell.find(".record .ties").text())
                };
                
                var tfoot_tds = team.find("table.players tfoot tr td");
                var player_trs = team.find("table.players tbody tr.player");

                var mod = 0;
                if (tfoot_tds.eq(0).attr("colspan") == "2"){
                    mod = 1;
                }

                _(proclist).filter(function (proc){return proc.type == "number"}).forEach(function (proc){
                    var lstatname = proc.name.toLowerCase();
                    stats[lstatname] = 0;

                    player_trs.each(function (i, row){
                        row = $(row);
                        stats[lstatname] += parseInt(row.find("td").eq(proc.index).find("input").val() || 0);
                    });

                    tfoot_tds.eq(proc.index - mod).text(stats[lstatname]);
                });

                _(proclist).filter(function (proc){return proc.type == "formula"}).forEach(function (proc){
                    var lstatname = proc.name.toLowerCase();
                    stats[lstatname] = _gametype.statdefs[lstatname].statfunc(stats);

                    tfoot_tds.eq(proc.index - mod).text(Math.round(stats[lstatname] * 100) / 100);
                });

                _(proclist).filter(function (proc){return proc.type == "rating"}).forEach(function (proc){
                    tfoot_tds.eq(proc.index - mod).text(Math.round(_gametype.ratingfunc(stats) * 100) / 100);
                });
            });

            $("tr.player").bind("calc-stats", function (){
                var player = $(this);

                var wltcell = player.parents("table.players:first").find("tfoot td:first");

                var stats = {
                    wins: parseInt(wltcell.find(".record .wins").text()),
                    losses: parseInt(wltcell.find(".record .losses").text()),
                    ties: parseInt(wltcell.find(".record .ties").text())
                };

                player.find("td .stat-input").each(function (i, o){
                    o = $(o);

                    var statname = $.trim(o.attr("name")).toLowerCase();
                    if (!stats[statname]){
                        var val;
                        if (_gametype.statdefs[statname.toLowerCase()].valtype == "integer"){
                            val = parseInt(o.val()) || 0;
                        }
                        else if (_gametype.statdefs[statname.toLowerCase()].valtype == "float"){
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
                    var statname = $.trim(o.attr("title")).toLowerCase();

                    if (_gametype.statdefs[statname]){
                        var result = _gametype.statdefs[statname].statfunc(stats);
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

                player.parents("li.team:first").trigger("calc-summary");
            }).bind("update-data", function (e, player){
                var self = $(this);

                if (player.groupcode){
                    self.find("select[name=groupcode]").val(player.groupcode);
                    self.find("select[name=player]").val(player.alias+"@"+player.handle);
                }
                else {
                    self.find("select[name=alias]").val(player.alias);
                    self.find("select[name=handle]").val(player.handle);
                }

                for (var lstatname in player.stats){
                    if (lstatname == "wins" || lstatname == "losses" || lstatname == "ties" || lstatname == "rating"){
                        continue;
                    }
                    else {
                        var statname = _gametype.statdefs[lstatname].name;
                        self.find("input[name="+statname+"], select[name="+statname+"]").val(player.stats[lstatname]);
                    }
                }

                self.trigger("calc-stats");
            });

            $("a.add-team").bind("click", function (){
                $("ul.teams").trigger("add-team");
                return false;
            });

            $("a.add-player").bind("click", function (){
                $(this).parents("li.team:first").trigger("add-player");
                return false;
            });

            $("a.remove-team").bind("click", function (){
                $(this).parents("li.team:first").trigger("remove");
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

            function _rank_change(){
                $(this).parents("ul.teams:first").trigger("calc-wlt");
            }

            $("input[name=rank]").bind("click", _rank_change)
                                 .bind("keyup", _rank_change)
                                 .bind("blur", _rank_change)
                                 .bind("change", _rank_change);


            var gtt = $.trim($(".gametype_data").text());
            if (gtt){
                _gametype = this.json(gtt);

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
            }
            else {
                this.log("GAMETYPE undefined");
            }

            this.trigger("loaddata");

            if (typeof MIN_TEAMS != "undefined"){
                _min_teams = MIN_TEAMS;
            }
            else {
                this.log("MIN_TEAMS undefined");
            }

            $("ul.teams").trigger("check-minimum");

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

            $("tr.player").trigger("calc-stats");
        });

        function noop(){}

        this.get('', noop);
        this.get("#!/", noop);

        this.post("#!/submit/:disputeid", function (){
            var _app = this;
            var disputeid = this.params.disputeid;
            var resnote = $("textarea[name=resolution_note]").val();

            //generate the teams object
            var teams = [];            
            $("ul.teams li.team").each(function (i,o){
                var teamli = $(o);
                var team = {};

                team.rank = parseInt($("input[name=rank]", teamli).val());
                team.players = [];
                $("table.players tr.player", teamli).each(function (i,o){
                    var playerrow = $(o);
                    var player = {};

                    if ($("select[name=groupcode]", playerrow).length){
                        player.groupcode = $.trim($("select[name=groupcode]", playerrow).val());
                    }

                    if ($("select[name=player]", playerrow).length){
                        var playertext = $("select[name=player]", playerrow).val();
                        var atindex = $.inArray("@", playertext.split(''));

                        if (atindex > -1){
                            player.alias = $.trim(playertext.substring(0, atindex));
                            player.handle = $.trim(playertext.substring(atindex + 1));
                        }
                    }

                    if ($("select[name=handle]", playerrow).length){
                        player.handle = $.trim($("select[name=handle]", playerrow).val());
                    }

                    if ($("select[name=alias]", playerrow).length){
                        player.alias = $.trim($("select[name=alias]", playerrow).val());
                    }

                    player.stats = {};

                    var wltcell = playerrow.parents("table.players:first").find("tfoot td:first");

                    var tmpstats =  {
                        wins: parseInt(wltcell.find(".record .wins").text()),
                        losses: parseInt(wltcell.find(".record .losses").text()),
                        ties: parseInt(wltcell.find(".record .ties").text())
                    };

                    _gametype.stats.forEach(function (stat){
                        var lstatname = stat.name.toLowerCase();
                        player.stats[lstatname] = $("input[name="+stat.name+"], select[name="+stat.name+"]", playerrow).first().val();

                        if (_gametype.statdefs[lstatname].valtype == "integer"){
                            player.stats[lstatname] = parseInt(player.stats[lstatname]) || 0;
                        }
                        else if (_gametype.statdefs[lstatname].valtype == "float"){
                            player.stats[lstatname] = parseFloat(player.stats[lstatname]) || 0.;
                        }

                        tmpstats[lstatname] = player.stats[lstatname];
                    });

                    _gametype.stats.forEach(function (stat){
                        if (stat.valtype == "formula"){
                            var lstatname = stat.name.toLowerCase();
                            player.stats[lstatname] = _gametype.statdefs[lstatname].statfunc(tmpstats);
                        }
                    });

                    team.players.push(player);
                });

                teams.push(team);
            });

            var handles_seen = [];
            var groups_seen = {};
            var uses_groups = false;
            var errors = [];

            teams.forEach(function (team, tindex){
                team.players.forEach(function (player){
                    var msg;

                    //group codes can't appear on different teams
                    if (!uses_groups && player.groupcode) {
                        uses_groups = true;
                    }
                    
                    if (uses_groups && !player.groupcode){
                        msg = "All players must have a group listed.";
                        if ($.inArray(msg, errors) == -1){
                            errors.push(msg);
                        }
                    }
                    /*else if (uses_groups){
                        if (typeof groups_seen[player.groupcode.toLowerCase()] != "undefined"){
                            if (_(groups_seen[player.groupcode.toLowerCase()]).filter(function (teami){return teami != tindex;}).length > 0){
                                msg = "Players in the same group may not be on different teams.";
                                if ($.inArray(msg, errors) == -1){
                                    errors.push(msg);
                                }
                            }

                            groups_seen[player.groupcode.toLowerCase()].push(tindex);
                        }
                        else {
                            groups_seen[player.groupcode.toLowerCase()] = [tindex];
                        }
                    }*/

                    //a handle can't appear twice
                    if ($.inArray(player.handle.toLowerCase(), handles_seen) > -1){
                        msg = "The same player cannot be listed more than once.";
                        if ($.inArray(msg, errors) == -1){
                            errors.push(msg);
                        }
                    }
                    else {
                        handles_seen.push(player.handle.toLowerCase());
                    }

                    //handles and aliases all defined
                    player.handle = $.trim(player.handle);
                    player.alias = $.trim(player.alias);

                    if (!player.handle){
                        msg = "All players must have a handle listed.";
                        if ($.inArray(msg, errors) == -1){
                            errors.push(msg);
                        }
                    }

                    if (!player.alias){
                        msg = "All players must have an alias listed.";
                        if ($.inArray(msg, errors) == -1){
                            errors.push(msg);
                        }
                    }

                    //enums are valid
                    for (var statname in player.stats){
                        if (_gametype.statdefs[statname.toLowerCase()].valtype == "enum"){
                            var stat = player.stats[statname];
                            if ($.inArray(stat, _gametype.statdefs[statname.toLowerCase()].enum_list) == -1){
                                msg = "Choices must be made from the provided lists.";
                                if ($.inArray(msg, errors) == -1){
                                    errors.push(msg);
                                }
                            }
                        }
                    }
                });
            });

            //minimum number of teams
            if (teams.length < _min_teams){
                errors.push("You must have at least "+_min_teams+" teams.");
            }

            if (errors.length == 0){

                var url = "";
                if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                    url = "edit";
                }

                $.ajax({
                    type: 'put',
                    url: url,
                    data: {teams: teams, disputeid: disputeid, resolution_note: resnote},
                    dataType: 'json',
                    success: function (data){
                        if (data.ok)
                        {
                            _app.redirect(data.redir_url);
                        }
                        else
                        {
                            $("#flash").trigger('error', [data.error]);
                        }
                    },
                    error: function (){
                        $("#flash").trigger('error', ['Request error']);
                    }
                });
            }
            else {
                errors.forEach(function (error){
                    $("#flash").trigger("error", [error]);
                });
            }

        });
    });

    matchedit.run();
});