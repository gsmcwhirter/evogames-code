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
            $(".modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/withdraw", function (){
            this.redirect("#!/");
        });

        this.get("#!/withdraw/:handle", function (){
            //show confirmation form
            var handle = this.params.handle;
            $("#withdraw-modal .handle").text(handle);
            $("#withdraw-modal form").attr('action', '#!/withdraw/'+handle);
            $("#withdraw-modal").trigger("open-overlay");
        });

        this.post("#!/withdraw/:handle", function (){
            var handle = this.params.handle;
            var self = this;

            $.ajax({
                type: 'delete',
                url: "invites/@"+handle,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $(".group-members-list li[title="+handle+"]").remove();
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
            $("#add-modal input[name=handle]").val("");
            $("#add-modal").trigger("open-overlay");
        });

        this.post("#!/add", function (){
            var handle = $.trim($("#add-modal input[name=handle]").val());
            var self = this;

            if (handle){
                $.ajax({
                    type: 'put',
                    url: "invites/add",
                    data: {handle: handle},
                    dataType: 'json',
                    success: function (data){
                        if (data.ok)
                        {
                            $("ul.group-members-list").prepend("<li title='"+handle+"'><span class='handle only'>@"+handle+"</span><a class='action withdraw' href='#!/withdraw/"+handle+"'>withdraw</a></li>");
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
                $("#flash").trigger('error', ['You must provide a handle.']);
                this.redirect("#!/cancel");
            }
        });
    });

    invites.run();
});