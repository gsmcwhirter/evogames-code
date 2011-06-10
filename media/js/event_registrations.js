$(function (){
    var registrations = $.sammy("#registration-controls", function (){

        this.bind('run', function (){
            $("#remove-modal").overlay({
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
            $("#remove-modal").trigger("close-overlay");
            $(".modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/remove", function (){
            this.redirect("#!/");
        });

        this.get("#!/remove/player", function (){
            this.redirect("#!/");
        });

        this.get("#!/remove/group", function (){
            this.redirect("#!/");
        });

        function show_modal(type){
            return function (){
                var handle = this.params.handle;
                var alias = this.params.alias;
                var code = this.params.code;

                if (type == "player"){
                    $("#remove-modal .alias").text(alias);
                    $("#remove-modal .handle").text("@"+handle);
                    $("#remove-modal .code").empty();
                    $("#remove-modal form").attr('action', '#!/remove/player/'+alias+"/"+handle);
                }
                if (type == "group"){
                    $("#remove-modal .alias").empty();
                    $("#remove-modal .handle").empty();
                    $("#remove-modal .code").text(code);
                    $("#remove-modal form").attr('action', '#!/remove/group/'+code);
                }

                $("#remove-modal").trigger("open-overlay");
            }
        }

        this.get("#!/remove/player/:alias/:handle", show_modal("player"));
        this.get("#!/remove/group/:code", show_modal("group"));

        function process_modal(type){
            return function (){
                var handle = this.params.handle;
                var alias = this.params.alias;
                var code = this.params.code;
                var self = this;

                var _url = "remove/";
                if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                    _url = "registrations/"+_url;
                }

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

        this.post("#!/remove/player/:alias/:handle", process_modal("player"));
        this.post("#!/remove/group/:code", process_modal("group"));
    });

    registrations.run();
});