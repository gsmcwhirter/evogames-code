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
        function goroot(){
            this.redirect("#!/");
        }

        this.get('', noop);
        this.get("#!/", noop);
        this.post("#!/", noop);

        this.get("#!/cancel", function (){
            $("#action-modal").trigger("close-overlay");
            $(".modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/approve", goroot);
        this.get("#!/deny", goroot);

        this.get("#!/approve/player", goroot);
        this.get("#!/deny/player", goroot);

        this.get("#!/approve/group", goroot);
        this.get("#!/deny/group", goroot);

        function show_form(verb, type){
            return function (){
                //show confirmation form
                var handle = this.params.handle;
                var alias = this.params.alias;
                var code = this.params.code;

                $("#action-modal .verb").text(verb);
                $("#action-modal .verb.header").text(verb.substring(0, 1).toUpperCase()+verb.substring(1));

                if (type == "player"){
                    $("#action-modal .alias").text(alias);
                    $("#action-modal .handle").text("@"+handle);
                    $("#action-modal .code").empty();
                    $("#action-modal form").attr('action', '#!/'+verb+'/player/'+alias+"/"+handle);
                }
                else if (type == "group"){
                    $("#action-modal .alias").empty();
                    $("#action-modal .handle").empty();
                    $("#action-modal .code").text(code);
                    $("#action-modal form").attr('action', '#!/'+verb+'/group/'+code);
                }
                
                $("#action-modal").trigger("open-overlay");
            };
        }

        this.get("#!/approve/player/:alias/:handle", show_form("approve","player"));
        this.get("#!/deny/player/:alias/:handle", show_form("deny","player"));

        this.get("#!/approve/group/:code", show_form("approve","group"));
        this.get("#!/deny/group/:code", show_form("deny","group"));

        function process_form(verb, type){
            return function (){
                var handle = this.params.handle;
                var alias = this.params.alias;
                var code = this.params.code;
                var self = this;

                var _url = "requests/"+verb+"/";
                var identifier;
                if (type == "player"){
                    identifier = alias+"@"+handle;
                }
                else if (type == "group") {
                    identifier = code;
                }
                _url += type+"-"+identifier.toLowerCase();

                $.ajax({
                    type: 'delete',
                    url: _url,
                    dataType: 'json',
                    success: function (data){
                        if (data.ok)
                        {
                            $(".group-members-list li[title="+identifier.toLowerCase()+"]").remove();
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
        }

        this.post("#!/approve/player/:alias/:handle", process_form("approve","player"));
        this.post("#!/deny/player/:alias/:handle", process_form("deny","player"));

        this.post("#!/approve/group/:code", process_form("approve","group"));
        this.post("#!/deny/group/:code", process_form("deny","group"));
    });

    requests.run();
});