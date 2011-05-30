$(function (){
    var owners = $.sammy("#group-owners", function (){

        this.bind('run', function (){
            $("#add-modal, #resign-modal").overlay({
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

        this.get("#!/cancel", function (){
            $("#resign-modal, #add-modal").trigger("close-overlay");

            this.redirect("#!/");
        });

        this.get("#!/resign", function (){
            //show confirmation form
            $("#resign-modal").trigger("open-overlay");
        });

        this.post("#!/resign", function (){
            var self = this;

            $.ajax({
                type: 'delete',
                url: "owners/resign",
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $(".group-owners li[title=me]").remove();
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
            //var handle = $("#add-modal input[name=handle]").val();
            var handle = $.trim(this.params.handle);
            var self = this;

            if (handle){
                $.ajax({
                    type: 'put',
                    url: "owners/add",
                    data: {handle: handle},
                    dataType: 'json',
                    success: function (data){
                        if (data.ok)
                        {
                            $("ul.group-members-list").prepend("<li title='"+handle+"'><span class='handle only'>@"+handle+"</span></li>");
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

    owners.run();
});