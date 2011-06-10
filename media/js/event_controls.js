$(function (){
    var econtrols = $.sammy("#event-controls", function (){

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

            this.redirect("#!/");
        });

        this.get("#!/remove", function (){
            //show confirmation form
            $("#remove-modal").trigger("open-overlay");
        });

        this.post("#!/remove", function (){
            var self = this;

            var url = "delete";
            if (window.location.pathname.substring(window.location.pathname.length - 1) != "/"){
                url = "controls/"+url;
            }

            $.ajax({
                type: 'delete',
                url: url,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        window.location = "/game";
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
    });

    econtrols.run();
});