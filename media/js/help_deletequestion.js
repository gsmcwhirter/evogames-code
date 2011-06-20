$(function (){
    var help = $.sammy("#help", function (){

        this.bind('run', function (){
            $("#delete-modal").overlay({
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
            $("#delete-modal").trigger("close-overlay");
            $("#delete-modal form").attr('action', '#!/');

            this.redirect("#!/");
        });

        this.get("#!/delete/:id", function (){
            //show confirmation form
            var id = this.params.id;
            var qtext = $(".question#questiondiv-"+id+" a h4").text();
            $("#delete-modal .question-text").text('"'+qtext+'"');
            $("#delete-modal form").attr('action', '#!/delete/'+id);
            $("#delete-modal").trigger("open-overlay");
        });

        this.post("#!/delete/:id", function (){
            var id = this.params.id;
            var self = this;

            $.ajax({
                type: 'delete',
                url: "/help/id/"+id+"/delete",
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $(".question#questiondiv-"+id).remove();
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

    help.run();
});