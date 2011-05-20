$(function (){
    var requests = $.sammy("#request-controls", function (){

        this.bind('run', function (){
            $("#action-modal").overlay({
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
            $("#action-modal").trigger("close-overlay");
            $(".modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/approve", function (){
            this.redirect("#!/");
        });

        this.get("#!/deny", function (){
            this.redirect("#!/");
        });

        function show_form(verb){
            return function (){
                //show confirmation form
                var handle = this.params.handle;
                var alias = this.params.alias;
                $("#action-modal .alias").text(alias);
                $("#action-modal .handle").text("@"+handle);
                $("#action-modal .verb").text(verb);
                $("#action-modal form").attr('action', '#!/'+verb+'/'+alias+"/"+handle);
                $("#action-modal").trigger("open-overlay");
            };
        }

        this.get("#!/approve/:alias/:handle", show_form("approve"));
        this.get("#!/deny/:alias/:handle", show_form("deny"));

        function process_form(verb){
            return function (){
                var handle = this.params.handle;
                var alias = this.params.alias;
                var self = this;

                $.ajax({
                    type: 'delete',
                    url: "requests/"+alias+"@"+handle+"/"+verb,
                    dataType: 'json',
                    success: function (data, textStatus){
                        if (data.ok)
                        {
                            $(".group-members-list li[title="+alias+"@"+handle+"]").remove();
                            $("#flash").trigger("info", [data.info]);
                        }
                        else
                        {
                            $("#flash").trigger('error', [data.error]);
                        }

                        self.redirect("#!/cancel");
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown){
                        $("#flash").trigger('error', 'Request error');
                        self.redirect("#!/cancel");
                    }
                });
            }
        }

        this.post("#!/approve/:alias/:handle", process_form("approve"));
        this.post("#!/deny/:alias/:handle", process_form("deny"));
    });

    requests.run();
});