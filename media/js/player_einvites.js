$(function (){
    var invitations = $.sammy("#invitations", function (){

        this.bind('run', function (){
            $("#decline-modal").overlay({
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
            $("#decline-modal").trigger("close-overlay");
            $("#decline-modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/decline", function (){
            this.redirect("#!/");
        });

        this.get("#!/decline/:gamecode/:eventslug/:pid", function (){
            //show confirmation form
            var code = this.params.gamecode;
            var slug = this.params.eventslug;
            var id = this.params.pid;
            var name = $("a[href=#!/decline/"+code+"/"+slug+"/"+id+"]").attr('rel');
            $("#decline-modal .name").text(name);
            $("#decline-modal form").attr('action', '#!/decline/'+code+'/'+slug+'/'+id);
            $("#decline-modal").trigger("open-overlay");
        });

        this.post("#!/decline/:gamecode/:eventslug/:pid", function (){
            var code = this.params.gamecode;
            var slug = this.params.eventslug;
            var id = this.params.pid;
            var self = this;

            $.ajax({
                type: 'delete',
                url: "/game/"+code+"/event/"+slug+"/decline/"+id,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $(".invited-groups li[title="+slug+"]").first().remove();
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

    invitations.run();
});