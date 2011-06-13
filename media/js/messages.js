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
            $("#directory-nav").bind("highlight", function (e, target){
                var self = $(this);
                self.find("li.selected").removeClass("selected");
                self.find("li#nav-"+target).addClass("selected");
            });

            $(".pane").bind("loading", function (){
                var self = $(this);
                var tbody = self.find("table tbody");
                tbody.find("tr").remove();
                tbody.append("<tr class='loading'><td colspan='5' style='text-align: center;'>Loading...</td></tr>");
            }).bind("loaddata", function (e, messages){
                var self = $(this);
                var box = self.attr("id");
                var tbody = self.find("table tbody");
                tbody.empty();

                if (messages && messages.length){
                    messages.forEach(function (message){
                        var newrow = $("<tr> <td></td> <td></td> <td></td> <td></td> <td></td> </tr>");

                        if (box == "inbox" && !message.is_read){
                            newrow.find("td").eq(0).append("");
                        }
                        else {
                            newrow.find("td").eq(0).append("<span class='new'>New</span>");
                        }

                        newrow.find("td").eq(1).append("<a href='#!/"+(box == "drafts" ? "edit" : "view")+"/"+message._id+"'>"+message.subject+"</a>");

                        if (box == "inbox"){
                            newrow.find("td").eq(2).append("<a href=''><span class='handle only'>"+message.from+"</span></a>");
                        }
                        else {
                            newrow.find("td").eq(2).append(_(message.to).map(function (rec){return rec.handle;}).join(", "));
                        }

                        newrow.find("td").eq(3).append(message.status.date);
                        newrow.find("td").eq(4).append("<input type='checkbox' name='action' value='yes'>");

                        tbody.append(newrow);
                    });
                }
                else {
                    tbody.append("<tr><td colspan='5' style='text-align: center;'>You have no messages in your "+box+".</td></tr>")
                }
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
                    var page;

                    if (this.params.page){
                        url += "&nextpage="+this.params.page;
                        page = this.params.page;
                    }

                    $(".pane").hide();
                    $("#directory-nav").trigger("highlight", [box]);
                    $("#"+box).show();
                    $("#"+box).trigger("loading");
                    $.get(url, function (data){
                        if (data.messages){
                            last_box = box;
                            last_page = page || '';

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

        this.get("#!/inbox", show_box('inbox'));
        this.get('#!/inbox/:page', show_box('inbox'));

        this.get("#!/outbox", show_box('outbox'));
        this.get("#!/outbox/:page", show_box('outbox'));

        this.get("#!/drafts", show_box('drafts'));
        this.get("#!/drafts/:page", show_box('drafts'));

        this.get("#!/close", function (){
            this.redirect("#!/"+last_box+(last_page != "" ? "/"+last_page : ""));
        });

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