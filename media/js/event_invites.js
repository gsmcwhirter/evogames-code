$(function (){
    var invites = $.sammy("#invite-controls", function (){

        this.bind('run', function (){
            $("#withdraw-modal, #add-modal").overlay({
                mask: {
                    color: '#ccc',
                    loadSpeed: 200,
                    opacity: 0.9
                },
                top: 200,
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
            $("#withdraw-modal, #add-modal").trigger("close-overlay");
            $("#withdraw-modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/withdraw", function (){
            this.redirect("#!/");
        });

        this.get("#!/withdraw/:id", function (){
            //show confirmation form
            var id = this.params.id;
            var idnamediv = $("li[title="+id+"] .id-name");
            if (idnamediv.hasClass("handle")){
                $("#withdraw-modal .handle").text(idnamediv.text());
                $("#withdraw-modal .name").empty();
            }
            else {
                $("#withdraw-modal .handle").empty();
                $("#withdraw-modal .name").text(idnamediv.text());
            }
            
            $("#withdraw-modal form").attr('action', '#!/withdraw/'+id);
            $("#withdraw-modal").trigger("open-overlay");
        });

        this.post("#!/withdraw/:id", function (){
            var id = this.params.id;
            var self = this;

            var url = id;
            if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                url = "invites/"+url;
            }

            $.ajax({
                type: 'delete',
                url: url,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $(".group-members-list li[title="+id+"]").remove();
                        $("#flash").trigger("info", [data.info]);
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

        this.get("#!/add", function (){
            $("#add-modal input[name=code_or_handle]").val("");
            $("#add-modal").trigger("open-overlay");
        });

        this.post("#!/add", function (){
            var code_or_handle = $.trim($("#add-modal input[name=code_or_handle]").val());
            var self = this;

            if (code_or_handle){
                var url = "add";
                if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                    url = "invites/"+url;
                }

                $.ajax({
                    type: 'put',
                    url: url,
                    data: {code_or_handle: code_or_handle},
                    dataType: 'json',
                    success: function (data){
                        if (data.ok)
                        {
                            var newli = $("<li title='"+data.id+"' />");
                            if (data.type == "player"){
                                newli.append("<span class='handle only id-name'>@"+data.name_or_handle+"</span>");
                            }
                            else {
                                newli.append("<span class='id-name'>"+data.name_or_handle+"</span>");
                            }

                            newli.append("<a class='action withdraw' href='#!/withdraw/"+data.id+"'>withdraw</a>")

                            $("ul.group-members-list").prepend(newli);
                            $("#flash").trigger("info", [data.info]);
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
              }
            else {
                $("#flash").trigger('error', ['You must provide a participant identifier.']);
                this.redirect("#!/cancel");
            }
        });
    });

    invites.run();
});