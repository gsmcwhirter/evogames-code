$(function (){
    var members = $.sammy("#member-controls", function (){

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

        this.get("#!/remove/:alias/:handle", function (){
            //show confirmation form
            var handle = this.params.handle;
            var alias = this.params.alias;
            $("#remove-modal .alias").text(alias);
            $("#remove-modal .handle").text("@"+handle);
            $("#remove-modal form").attr('action', '#!/remove/'+alias+"/"+handle);
            $("#remove-modal").trigger("open-overlay");
        });

        this.post("#!/remove/:alias/:handle", function (){
            var handle = this.params.handle;
            var alias = this.params.alias;
            var self = this;

            var url = alias+"@"+handle+"/remove";
            if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                url = "members/"+url;
            }

            $.ajax({
                type: 'delete',
                url: url,
                dataType: 'json',
                success: function (data){
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
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                    self.redirect("#!/cancel");
                }
            });
        });
    });

    members.run();
});