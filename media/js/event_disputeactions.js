$(function (){
    var disputes = $.sammy("#disputes", function (){
        var _app = this;

        this.bind("run", function (){
            var _app = this;

            $("#resolve-modal, #delete-modal").overlay({
                mask: {
                    color: '#ccc',
                    loadSpeed: 200,
                    opacity: 0.9
                },
                top: 50,
                closeOnClick: false
            }).bind("open-overlay", function (){
                var api = $(this).data("overlay");

                api.load();
            }).bind('close-overlay', function (){
                var api = $(this).data("overlay");

                api.close();
            });
        });

        function noop(){}

        this.get('', noop);
        this.get("#!/", noop);
        this.post("#!/", noop);
        
        this.get("#!/cancel", function (){
            $("#resolve-modal, #delete-modal").trigger("close-overlay");
            $("#resolve-modal form, #delete-modal form").attr('action', '#!/');
            $("#resolve-modal textarea[name=resolution_note]").val('');
            this.redirect("#!/");
        });

        this.get("#!/delete/:matchid", function (){
            //show confirmation form
            var matchid = this.params.matchid;
            $("#delete-modal .matchid").text(matchid);
            $("#delete-modal form").attr('action', '#!/delete/'+matchid);
            $("#delete-modal").trigger("open-overlay");
        });

        this.post("#!/delete/:matchid", function (){
            var matchid = this.params.matchid;
            var self = this;

            var url = "delete";
            var trailingslash = true;
            if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                trailingslash = false;
            }
            
            var hasmatchid = window.location.pathname.indexOf(matchid) > -1;
            
            if ((hasmatchid && !trailingslash) || (!hasmatchid && trailingslash)){
                url = matchid+"/"+url;
            }
            else if (!hasmatchid){
                url = "disputes/"+matchid+"/"+url;
            }


            $.ajax({
                type: 'delete',
                url: url,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        self.redirect(data.redir_url);
                    }
                    else
                    {
                        $("#flash").trigger('error', [data.error]);
                        self.redirect("#!/cancel");
                    }
                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                    self.redirect("#!/cancel");
                }
            });
        });

        this.get("#!/resolve/:matchid/:disputeid", function (){
            var matchid = this.params.matchid;
            var disputeid = this.params.disputeid;
            $("#resolve-modal .matchid").text(matchid);
            $("#resolve-modal .disputeid").text(disputeid);
            $("#resolve-modal form").attr('action', "#!/resolve/"+matchid+"/"+disputeid);
            $("#resolve-modal textarea[name=resolution_note]").val('');
            $("#resolve-modal").trigger("open-overlay");
        });

        this.post("#!/resolve/:matchid/:disputeid", function (){
            var matchid = this.params.matchid;
            var disputeid = this.params.disputeid;
            var self = this;

            var url = "resolve";
            var trailingslash = true;
            if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                trailingslash = false;
            }

            var hasmatchid = window.location.pathname.indexOf(matchid) > -1;

            if ((hasmatchid && !trailingslash) || (!hasmatchid && trailingslash)){
                url = matchid+"/"+url;
            }
            else if (!hasmatchid){
                url = "disputes/"+matchid+"/"+url;
            }

            $.ajax({
                type: 'put',
                data: {resolution_note: this.params.resolution_note, disputeid: disputeid},
                url: url,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $("#flash").trigger("info", [data.info]);
                        var disputeli = $(".match-display[title="+matchid+"] ul.disputes li[title="+disputeid+"]");
                        disputeli.find(".status span.status-text").removeClass("red").addClass("green").text("Resolved");
                        disputeli.find(".status .actions").remove();
                        disputeli.append("<div class='dispinfo'>Resolved by <span class='handle only'>@"+data.handle+"</span> on "+data.datetime+"</div>")
                                 .append("<div class='note'>"+data.note+"<div>&nbsp;</div></div>");
                    }
                    else
                    {
                        $("#flash").trigger('error', [data.error]);
                    }
                    self.redirect("#!/cancel");
                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                    self.redirect("#!/cancel");
                }
            });
        });

        this.post("#!/toggle", function (){
            var policy = this.params.disputes_closed;

            if (policy != "yes" && policy != "no"){
                $("#flash").trigger("error", ["The dispute policy must be selected from the list."]);
            }
            else {
                var url = (policy == "yes" ? "allow" : "disallow");
                if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                    url = "disputes/"+url;
                }

                $.ajax({
                    type: 'delete',
                    url: url,
                    dataType: 'json',
                    success: function (data){
                        if (data.ok)
                        {
                            $("#flash").trigger("info", [data.info]);
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
        });
    });

    disputes.run();
});