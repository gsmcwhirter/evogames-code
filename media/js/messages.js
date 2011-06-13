$(function (){
    var messages = $.sammy("#messages", function (){
        this.use("JSON");

        var last_box = 'inbox';
        var last_page = '';
        
        var pages_ord = {
            inbox: [],
            outbox: [],
            drafts: []
        };

        this.bind("run", function (){
            $(".pane").bind("loading", function (){
                var self = $(this);
                var tbody = self.find("table tbody");
                tbody.find("tr").remove();
                tbody.append("<tr class='loading'><td colspan='5' style='text-align: center;'><img src='' alt='Loading...'></td></tr>");
            }).bind("loaddata", function (e, messages){
                var self = $(this);
                var tbody = self.find("table tbody");
                tbody.empty();

                (messages || []).forEach(function (message){
                    var newrow = $("<tr><td></td><td></td><td></td><td></td><td></td></tr>");

                    newrow.find("td").eq(0).append("");
                    newrow.find("td").eq(1).append("");
                    newrow.find("td").eq(2).append("");
                    newrow.find("td").eq(3).append("");
                    newrow.find("td").eq(4).append("");

                    tbody.append(newrow);
                });
            }).bind("nextpage", function (e, nextpage){
                var self = $(this);
                var box = self.attr("id");

                if (nextpage){
                    self.find(".nextpage").attr("href", "#!/"+box+"/"+nextpage).show();
                }
                else {
                    self.find(".nextpage").hide();
                }
            }).bind("prevpage", function (e, prevpage){
                var self = $(this);
                var box = self.attr("id");

                if (prevpage){
                    self.find(".prevpage").attr("href", "#!/"+box+"/"+prevpage).show();
                }
                else {
                    self.find(".prevpage").hide();
                }
            });
        });

        function show_box(box){
            if (box == "inbox" || box == "outbox" || box == "drafts"){
                return function (){
                    var perpage = parseInt($("#perpage").val()) || 10;
                    var url = "/messages/"+box+"?limit="+perpage;
                    if (this.params.page){
                        url += "&nextpage="+this.params.page;
                    }

                    $(".pane").hide();
                    $("#"+box).show();
                    $("#"+box).trigger("loading");
                    $.get(url, function (data){
                        if (data.messages){
                            last_box = box;
                            last_page = this.params.page || '';

                            var pane = $("#"+box);

                            var page_index = pages_ord[box].indexOf(last_page);

                            if (page_index == -1){
                                pages_ord[box] = [last_page];
                                page_index = 0;
                            }

                            if (page_index < pages_ord[box].length - 1 && data.nextpage != pages_ord[box][pages_ord[box].length - 1]){
                                pages_ord[box] = pages_ord[box].slice(0, page_index + 1);
                            }
                            
                            if (data.nextpage){
                                pages_ord.push(data.nextpage);
                            }

                            if (page_index > 0){
                                pane.trigger("prevpage", [pages_ord[box][page_index - 1]]);
                            }
                            else {
                                pane.trigger("prevpage", [false]);
                            }

                            if (page_index < pages_ord[box].length - 1){
                                pane.trigger("nextpage", [pages_ord[box][page_index + 1]]);
                            }
                            else {
                                pane.trigger("nextpage", [false]);
                            }

                            pane.trigger("loaddata", [data.messages]);
                        }
                        else {
                            $("#flash").trigger("error", ["Request error"]);
                        }
                    });
                }
            }
            else {
                return function (){}
            }
        }

        this.get('', show_box('inbox'));
        this.get('#!/inbox/:page?', show_box('inbox'));
        this.get("#!/outbox/:page?", show_box('outbox'));
        this.get("#!/drafts/:page?", show_box('drafts'));

        this.get("#!/view/:message_id", function (){

        });

        this.get("#!/edit/:message_id", function (){

        });

        this.post("#!/edit/:message_id", function (){

        });

        this.get("#!/compose", function (){

        });

        this.post("#!/compose", function (){

        });


    });

    messages.run();
});