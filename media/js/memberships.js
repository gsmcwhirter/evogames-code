$(function (){
    var memberships = $.sammy("#memberships", function (){

        this.bind('run', function (){
            $("#leave-modal, #decline-modal").overlay({
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
            $("#decline-modal, #leave-modal").trigger("close-overlay");
            $(".modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/decline", function (){
            this.redirect("#!/");
        });

        this.get("#!/decline/:code", function (){
            //show confirmation form
            var code = this.params.code;
            var name = $("a[href=#!/decline/"+code+"]").attr('rel');
            $("#decline-modal .club-name").text(name);
            $("#decline-modal form").attr('action', '#!/decline/'+this.params.code);
            $("#decline-modal").trigger("open-overlay");
        });

        this.post("#!/decline/:code", function (){
            var code = this.params.code;
            var self = this;

            $.ajax({
                type: 'delete',
                url: '/group/'+code+"/decline",
                dataType: 'json',
                success: function (data, textStatus){
                    if (data.ok)
                    {
                        $(".invited-groups li[title="+code+"]").first().remove();
                        $("#flash").trigger("info", [data.info]);
                    }
                    else
                    {
                        $("#flash").trigger('error', [data.error]);
                    }

                    self.redirect("#!/cancel");
                },
                error: function (XMLHttpRequest, textStatus, errorThrown){
                    $("#flash").trigger('error', ['Request error']);
                    self.redirect("#!/cancel");
                }
            });
        });

        this.get("#!/leave", function (){
            this.redirect("#!/");
        });

        this.get("#!/leave/:code", function (){
            this.redirect("#!/");
        });

        this.get("#!/leave/:code/:alias", function (){
            //show confirmation form
            var code = this.params.code;
            var alias = this.params.alias;
            var name = $("a[href=#!/leave/"+code+"/"+alias+"]").attr('rel');
            $("#leave-modal .alias").text(alias);
            $("#leave-modal .club-name").text(name);
            $("#leave-modal form").attr('action', '#!/leave/'+this.params.code+"/"+alias);
            $("#leave-modal").trigger("open-overlay");
        });

        this.post("#!/leave/:code/:alias", function (){
            var code = this.params.code;
            var alias = this.params.alias;
            var self = this;

            $.ajax({
                type: 'delete',
                url: '/group/'+code+"/leave/"+alias,
                dataType: 'json',
                success: function (data, textStatus){
                    if (data.ok)
                    {
                        $(".member-groups li[title="+alias+" in "+code+"]").remove();
                        $("#flash").trigger("info", [data.info]);
                    }
                    else
                    {
                        $("#flash").trigger('error', [data.error]);
                    }

                    self.redirect("#!/cancel");
                },
                error: function (XMLHttpRequest, textStatus, errorThrown){
                    $("#flash").trigger('error', ['Request error']);
                    self.redirect("#!/cancel");
                }
            });
        });
    });

    memberships.run();
});