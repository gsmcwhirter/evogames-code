$(function (){
    var messages = $.sammy("#messages", function (){
        this.use("JSON");

        var speed = 200;
        var last_box = 'inbox';
        var last_page = '';

        var last_view = '';
        
        var pages_ord = {
            inbox: [""],
            outbox: [""],
            drafts: [""]
        };

        this.bind("run", function (){
            $("#directory-nav").bind("highlight", function (e, target){
                var self = $(this);
                self.find("li.selected").removeClass("selected");
                self.find("li#nav-"+target).addClass("selected");
            });

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

            $(".pane").bind("loading", function (){
                var self = $(this);
                var box = self.attr("id");
                var tbody = self.find("table tbody");
                tbody.find("tr").remove();
                tbody.append("<tr class='loading'><td colspan='"+(box == "outbox" ? 3 : 5)+"' style='text-align: center;'>Loading...</td></tr>");
            }).bind("loaddata", function (e, messages){
                var self = $(this);
                var box = self.attr("id");
                var tbody = self.find("table tbody");
                tbody.empty();

                if (messages && messages.length){
                    messages.forEach(function (message){
                        var newrow;
                        if (box == "outbox"){
                            newrow = $("<tr> <td></td> <td></td> <td></td> </tr>");

                            newrow.find("td").eq(0).append("<a href='#!/view/"+message._id+"'>"+message.subject+"</a>");
                            newrow.find("td").eq(1).append(_(message.to).map(formatRec).join(", "));
                            newrow.find("td").eq(2).append(message.status.date);
                        }
                        else {
                            newrow = $("<tr> <td style='text-align: center;'></td> <td></td> <td></td> <td></td> <td style='text-align: center;'></td> </tr>");

                            newrow.bind("markunread", function (){
                                $(this).find("td").eq(0).html("<span class='new'>New</span>");
                            }).bind("markread", function (){
                                $(this).find("td").eq(0).html("");
                            });


                            if (box == "inbox" && !message.is_read){
                                newrow.trigger("markunread");
                            }
                            else {
                                newrow.trigger("markread");
                            }

                            newrow.find("td").eq(1).append("<a href='#!/"+(box == "drafts" ? "edit" : "view")+"/"+message._id+"'>"+message.subject+"</a>");

                            if (box == "inbox"){
                                if (message.from){
                                    newrow.find("td").eq(2).append("<a href='/player/@"+message.from+"'><span class='handle only'>@"+message.from+"</span></a>");
                                }
                                else {
                                    newrow.find("td").eq(2).append("<span class='system'>EvoGames System</span>")
                                }
                                
                            }
                            else {
                                newrow.find("td").eq(2).append(_(message.to).map(formatRec).join(", "));
                            }

                            newrow.find("td").eq(3).append(message.status.date);
                            newrow.find("td").eq(4).append("<input type='checkbox' name='action' value='"+message._id+"'>");
                        }

                        tbody.append(newrow);
                    });
                }
                else {
                    tbody.append("<tr><td colspan='"+(box == "outbox" ? 3 : 5)+"' style='text-align: center;'>You have no messages in your "+box+".</td></tr>")
                }
            }).bind("nextpage", function (e, nextpage){
                var self = $(this);
                var box = self.attr("id");

                if (nextpage || nextpage === ""){
                    self.find(".nextpage").attr("href", "#!/"+box+"/"+nextpage).show();
                }
                else {
                    self.find(".nextpage").hide();
                }
            }).bind("prevpage", function (e, prevpage){
                var self = $(this);
                var box = self.attr("id");

                if (prevpage || prevpage === ""){
                    self.find(".prevpage").attr("href", "#!/"+box+"/"+prevpage).show();
                }
                else {
                    self.find(".prevpage").hide();
                }
            }).bind("clearchecks", function (){
                $(this).find("input[type=checkbox]").attr("checked","");
            });
            
            function toggleCheckAll(){
                var self = $(this);
                if (self.is(":checked")){
                    self.parents("table:first").find("tbody tr input[name=action]").attr("checked", "checked");
                }
                else {
                    self.parents("table:first").find("tbody tr input[name=action]").attr("checked", "");
                }
            }

            $(".pane table thead input[name=check_all]").bind("change", toggleCheckAll).bind("click", toggleCheckAll);

            $(".pane select[name=with_selected]").bind("change", function (){
                var self = $(this);

                if (self.val() != "0"){
                    var box = self.parents(".pane:first").attr("id");
                    var inds = [];
                    var ids = [];

                    var act = self.val();

                    self.val("0");
                    var checked = self.parents(".pane:first").find("input[name=action]").filter(":checked");

                    if (box == "inbox"){
                        if (act == "delete"){
                            inds = _(checked).map(function (inp){return ""+$(inp).parents("tr:first").index();});
                            $("#delete-modal form").attr('action', '#!/deletemany/'+inds.join(","));
                            $("#delete-modal").trigger("open-overlay");
                        }
                        else if (act == "unread"){
                            ids = _(checked).map(function (inp){return $(inp).val();});

                            checked.each(function (i, o){
                                $(o).parents("tr:first").trigger("markunread");
                            });

                            ids.forEach(function (id){
                                $.ajax({
                                    type: 'delete',
                                    url: "/messages/"+id+"/unread"
                                });
                            });
                        }
                        else if (act == "read"){
                            ids = _(checked).map(function (inp){return $(inp).val();});

                            checked.each(function (i, o){
                                $(o).parents("tr:first").trigger("markread");
                            });

                            ids.forEach(function (id){
                                $.get("/messages/"+id);
                            });
                        }
                    }
                    else if (box == "drafts"){
                        if (act == "delete"){
                            inds = _(checked).map(function (inp){return ""+$(inp).parents("tr:first").index();});
                            $("#delete-modal form").attr('action', '#!/deletemany/'+inds.join(","));
                            $("#delete-modal").trigger("open-overlay");
                        }
                    }
                }
            });

            $("a.add-cc").bind("click", function (){
                var self = $(this);
                self.parents("form:first").find(".form-line.cc").slideDown(speed);
                self.hide();
            });

            $("a.add-bcc").bind("click", function (){
                var self = $(this);
                self.parents("form:first").find(".form-line.bcc").slideDown(speed);
                self.hide();
            });

            $("button#send").bind("click", function (){
                var form = $(this).parents("form:first");
                form.find("input[name=action]").val("send");
                form.submit();
            });

            $("button#save").bind("click", function (){
                var form = $(this).parents("form:first");
                form.find("input[name=action]").val("save");
                form.submit();
            });
        });

        function show_box(box){
            if (box == "inbox" || box == "outbox" || box == "drafts"){
                return function (){
                    var perpage = parseInt($("#perpage").val()) || 10;
                    var url = "/messages/"+box+"?limit="+perpage;
                    var page = "";

                    var self = this;

                    last_view = '';

                    if (this.params.page){
                        console.log(this.params.page);
                        url += "&nextpage="+this.params.page;
                        page = this.params.page;
                    }

                    $(".pane").hide();
                    $("#directory-nav").trigger("highlight", [box]);
                    $("#"+box).show();
                    $("#"+box).trigger("loading");
                    $.get(url, function (data){
                        if (data.messages){
                            var pane = $("#"+box);

                            var page_index2 = pages_ord[box].indexOf(last_page);
                            var page_index = pages_ord[box].indexOf(page);

                            if (page_index == -1 && page != last_page){
                                pages_ord[box].push(page);
                                page_index = 1;
                            }

                            last_box = box;
                            last_page = page || '';

                            if (page_index < pages_ord[box].length - 1 && data.nextpage != pages_ord[box][pages_ord[box].length - 1]){
                                pages_ord[box] = pages_ord[box].slice(0, page_index + 1);
                            }
                            
                            if (data.nextpage){
                                pages_ord[box].push(self.json(data.nextpage));
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
                            pane.trigger("clearchecks");
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
        this.get("#!/", show_box('inbox'));

        this.get("#!/inbox/?", show_box('inbox'));
        this.get('#!/inbox/:page', show_box('inbox'));

        this.get("#!/outbox/?", show_box('outbox'));
        this.get("#!/outbox/:page", show_box('outbox'));

        this.get("#!/drafts/?", show_box('drafts'));
        this.get("#!/drafts/:page", show_box('drafts'));

        this.get("#!/close/?", function (){
            $("#compose form").attr("action", "#!/");
            this.redirect("#!/"+last_box+(last_page != "" ? "/"+last_page : ""));
        });

        this.get("#!/close2/?", function (){
            if (last_view){
                $("#compose form").attr("action", "#!/");
                this.redirect("#!/view/"+last_view);
            }
            else {
                this.redirect("#!/close");
            }
        });

        this.get("#!/view/:message_id", function (){
            var msgid = this.params.message_id;

            last_view = msgid;

            $(".pane").hide();
            var viewdiv = $("#view");
            viewdiv.show();
            viewdiv.find(".content").hide();
            viewdiv.find(".loading").show();

            $.get("/messages/"+msgid, function (data){
                if (data.message){
                    viewdiv.find(".msginfo .subject").text(data.message.subject);
                    if (data.message.from){
                        viewdiv.find(".msginfo .from a.handle-link").attr("href", "/player/@"+data.message.from).show();
                        viewdiv.find(".msginfo .from a.handle-link .handle").text("@"+data.message.from);
                        viewdiv.find(".msginfo .from .system").hide();
                    }
                    else {
                        viewdiv.find(".msginfo .from a.handle-link .handle").text('');
                        viewdiv.find(".msginfo .from a.handle-link").hide();
                        viewdiv.find(".msginfo .from .system").show();
                    }

                    viewdiv.find(".msginfo .to").html(_(data.message.to).map(formatRec).join(', '));
                    
                    if (data.message.cc.length){
                        viewdiv.find(".msginfo .cc").html(_(data.message.cc).map(formatRec).join(', ')).parents(".line:first").show();
                    }
                    else {
                        viewdiv.find(".msginfo .cc").html('').parents(".line:first").hide();
                    }

                    viewdiv.find(".actions .reply").attr("href", "#!/reply/"+data.message._id);
                    viewdiv.find(".actions .replyall").attr("href", "#!/replyall/"+data.message._id);
                    viewdiv.find(".actions .forward").attr("href", "#!/forward/"+data.message._id);

                    if (data.message.is_deleteable){
                        viewdiv.find(".actions .delete").attr("href", "#!/delete/"+data.message._id).show();
                    }
                    else {
                        viewdiv.find(".actions .delete").attr("href", "#!/").hide();
                    }
                    

                    viewdiv.find(".markdown").html(data.message.body_parsed);
                }

                viewdiv.find(".loading").hide();
                viewdiv.find(".content").show();
            });
        });

        function formatRec(rec){
            return "<a href='/player/@"+rec.handle+"'><span class='handle only'>@"+rec.handle+"</span></a>";
        }

        this.get("#!/edit/:message_id", function (){
            $("#directory-nav").trigger("highlight", ["compose"]);

            var msgid = this.params.message_id;
            $(".pane").hide();
            var compdiv = $("#compose");
            compdiv.show();
            compdiv.find(".loading").show();
            compdiv.find("form").hide();

            $.get("/messages/"+msgid, function (data){
                if (data.message){
                    compdiv.find("input[name=action]").val('');

                    compdiv.find("input[name=subject]").val(data.message.subject);
                    compdiv.find("textarea[name=body]").val(data.message.body);
                    compdiv.find("input[name=to]").val(_(data.message.to).map(function (rec){return rec.handle}).join(", "));

                    if (data.message.cc.length){
                        compdiv.find("input[name=cc]").val(_(data.message.cc).map(function (rec){return rec.handle}).join(", "));
                        compdiv.find(".form-line.cc").show();
                        compdiv.find("a.add-cc").hide();
                    }
                    else {
                        compdiv.find("input[name=cc]").val('');
                        compdiv.find(".form-line.cc").hide();
                        compdiv.find("a.add-cc").show();
                    }
                    
                    if (data.message.bcc.length){
                        compdiv.find("input[name=bcc]").val(_(data.message.bcc).map(function (rec){return rec.handle}).join(", "));
                        compdiv.find(".form-line.bcc").show();
                        compdiv.find("a.add-bcc").hide();
                    }
                    else {
                        compdiv.find("input[name=bcc]").val('');
                        compdiv.find(".form-line.bcc").hide();
                        compdiv.find("a.add-bcc").show();
                    }

                    if (data.message.status.sent){
                        compdiv.find("#delete").hide();
                    }
                    else {
                        compdiv.find("#delete").attr("href", "#!/delete/"+data.message._id).show();
                    }

                    compdiv.find(".loading").hide();
                    compdiv.find("form").attr("action", "#!/edit/"+msgid).show();
                }
            });
            
        });

        this.post("#!/edit/:message_id", function (){
            var compdiv = $("#compose");
            compdiv.find(".loading").show();

            var message = {
                to: this.params.to,
                cc: $("input[name=cc]").filter(":visible").length ? this.params.cc : "",
                bcc: $("input[name=bcc]").filter(":visible").length ? this.params.bcc : "",
                subject: this.params.subject,
                body: this.params.body,
                action: this.params.action
            };

            compdiv.find("form").hide();

            var self = this;

            $.ajax({
                type: 'put',
                data: message,
                url: "/messages/"+this.params.message_id,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $("#flash").trigger("info", [data.info]);

                        self.redirect("#!/close");
                    }
                    else
                    {
                        $("#flash").trigger('error', [data.error]);
                        compdiv.find(".loading").hide();
                        compdiv.find("form").show();
                    }
                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                    compdiv.find(".loading").hide();
                    compdiv.find("form").show();
                }
            });
        });

        this.get("#!/reply/:message_id", function (){
            $("#directory-nav").trigger("highlight", ["compose"]);

            var msgid = this.params.message_id;
            $(".pane").hide();
            var compdiv = $("#compose");
            compdiv.show();
            compdiv.find(".loading").show();
            compdiv.find("form").hide();

            $.get("/messages/"+msgid+"?for_reply=1", function (data){
                if (data.message){
                    compdiv.find("input[name=action]").val('');

                    compdiv.find("input[name=subject]").val(data.message.subject.substring(0, 3).toLowerCase() == "re:" ? data.message.subject : "Re: "+data.message.subject);
                    compdiv.find("textarea[name=body]").val("\n\nOn "+data.message.status.date+", "+data.message.from+" wrote:\n"+ data.message.body.split("\n").map(function(line){return "> "+line}).join("\n"));
                    compdiv.find("input[name=to]").val(_(data.message.from ? [{handle: data.message.from}] : []).map(function (rec){return rec.handle}).join(", "));


                    compdiv.find("input[name=cc]").val('');
                    compdiv.find(".form-line.cc").hide();
                    compdiv.find("a.add-cc").show();

                    compdiv.find("input[name=bcc]").val('');
                    compdiv.find(".form-line.bcc").hide();
                    compdiv.find("a.add-bcc").show();

                    compdiv.find("#delete").hide();

                    compdiv.find(".loading").hide();
                    compdiv.find("form").attr("action", "#!/compose").show();
                }
            });
        });

        this.get("#!/replyall/:message_id", function (){
            $("#directory-nav").trigger("highlight", ["compose"]);

            var msgid = this.params.message_id;
            $(".pane").hide();
            var compdiv = $("#compose");
            compdiv.show();
            compdiv.find(".loading").show();
            compdiv.find("form").hide();

            $.get("/messages/"+msgid+"?for_reply=1", function (data){
                if (data.message){
                    compdiv.find("input[name=action]").val('');

                    compdiv.find("input[name=subject]").val(data.message.subject.substring(0, 3).toLowerCase() == "re:" ? data.message.subject : "Re: "+data.message.subject);
                    compdiv.find("textarea[name=body]").val("\n\nOn "+data.message.status.date+", "+data.message.from+" wrote:\n"+ data.message.body.split("\n").map(function(line){return "> "+line}).join("\n"));
                    compdiv.find("input[name=to]").val(_(data.message.to.concat(data.message.from ? [{handle: data.message.from}] : [])).map(function (rec){return rec.handle}).join(", "));

                    if (data.message.cc.length){
                        compdiv.find("input[name=cc]").val(_(data.message.cc).map(function (rec){return rec.handle}).join(", "));
                        compdiv.find(".form-line.cc").show();
                        compdiv.find("a.add-cc").hide();
                    }
                    else {
                        compdiv.find("input[name=cc]").val('');
                        compdiv.find(".form-line.cc").hide();
                        compdiv.find("a.add-cc").show();
                    }

                    compdiv.find("input[name=bcc]").val('');
                    compdiv.find(".form-line.bcc").hide();
                    compdiv.find("a.add-bcc").show();

                    compdiv.find("#delete").hide();

                    compdiv.find(".loading").hide();
                    compdiv.find("form").attr("action", "#!/compose").show();
                }
            });
        });

        this.get("#!/forward/:message_id", function (){
            $("#directory-nav").trigger("highlight", ["compose"]);

            var msgid = this.params.message_id;
            $(".pane").hide();
            var compdiv = $("#compose");
            compdiv.show();
            compdiv.find(".loading").show();
            compdiv.find("form").hide();

            $.get("/messages/"+msgid, function (data){
                if (data.message){
                    compdiv.find("input[name=action]").val('');

                    compdiv.find("input[name=subject]").val(data.message.subject.substring(0, 4).toLowerCase() == "fwd:" ? data.message.subject : "Fwd: "+data.message.subject);
                    compdiv.find("textarea[name=body]").val("\n\nOn "+data.message.status.date+", "+data.message.from+" wrote:\n"+ data.message.body.split("\n").map(function(line){return "> "+line}).join("\n"));
                    compdiv.find("input[name=to]").val("");


                    compdiv.find("input[name=cc]").val('');
                    compdiv.find(".form-line.cc").hide();
                    compdiv.find("a.add-cc").show();

                    compdiv.find("input[name=bcc]").val('');
                    compdiv.find(".form-line.bcc").hide();
                    compdiv.find("a.add-bcc").show();

                    compdiv.find("#delete").hide();

                    compdiv.find(".loading").hide();
                    compdiv.find("form").attr("action", "#!/compose").show();
                }
            });
        });

        function showCompose(){
            $("#directory-nav").trigger("highlight", ["compose"]);
            $(".pane").hide();
            var compdiv = $("#compose");
            compdiv.show();
            compdiv.find(".loading").hide();
            compdiv.find("form").attr("action", "#!/compose").show();

            compdiv.find("#delete").hide();

            var to = this.params.to || "";

            compdiv.find("input[name=to]").val(to);
            compdiv.find("input[name=action], input[name=cc], input[name=bcc], input[name=subject], textarea[name=body]").val('');
            compdiv.find(".form-line.cc, .form-line.bcc").hide();
            compdiv.find("a.add-cc, a.add-bcc").show();
        }

        this.get("#!/compose", showCompose);
        this.get("#!/compose/:to", showCompose);

        this.post("#!/compose", function (){
            var compdiv = $("#compose");
            compdiv.find(".loading").show();

            var message = {
                to: this.params.to,
                cc: $("input[name=cc]").filter(":visible").length ? this.params.cc : "",
                bcc: $("input[name=bcc]").filter(":visible").length ? this.params.bcc : "",
                subject: this.params.subject,
                body: this.params.body,
                action: this.params.action
            };

            compdiv.find("form").hide();

            var self = this;

            $.ajax({
                type: 'put',
                data: message,
                url: "/messages",
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $("#flash").trigger("info", [data.info]);

                        self.redirect("#!/close");
                    }
                    else
                    {
                        $("#flash").trigger('error', [data.error]);
                        compdiv.find(".loading").hide();
                        compdiv.find("form").show();
                    }
                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                    compdiv.find(".loading").hide();
                    compdiv.find("form").show();
                }
            });
        });

        this.get("#!/cancel", function (){
            $("#delete-modal").trigger("close-overlay");
            $("#delete-modal form").attr('action', '#!/');

            this.redirect("#!/close2");
        });

        this.get("#!/cancel2", function (){
            $("#delete-modal").trigger("close-overlay");
            $("#delete-modal form").attr('action', '#!/');

            this.redirect("#!/close");
        });

        this.get("#!/delete/:message_id", function (){
            $("#delete-modal form").attr('action', '#!/delete/'+this.params.message_id);
            $("#delete-modal").trigger("open-overlay");
        });

        this.post("#!/delete/:message_id", function (){
            var self = this;
            var msgid = this.params.message_id;

            $.ajax({
                type: 'delete',
                url: "/messages/"+msgid,
                dataType: 'json',
                success: function (data){
                    if (data.ok)
                    {
                        $("#flash").trigger("info", [data.info]);
                        self.redirect("#!/cancel2");
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

        this.post("#!/deletemany/:indices", function (){
            var indices = _(this.params.indices.split(",")).map(function (i){return parseInt($.trim(i))});

            var ids = _(indices).map(function (index){
                return $(".pane table tbody tr input[name=action]").filter(":visible").eq(index).val();
            });

            var self = this;

            $.ajax({
                type: 'put',
                url: "/messages/delete",
                data: {ids: ids},
                dataType: "json",
                success: function (data){
                    if (!data.error){
                        if (data.max == data.succ){
                            $("#flash").trigger("info", ["All deletions were successful."]);
                        }
                        else {
                            $("#flash").trigger("error", ["Only "+data.succ+" of "+data.max+" deletions were successful."]);
                        }
                    }
                    else {
                        $("#flash").trgger("error", [data.error]);
                    }
                        
                    self.redirect("#!/cancel2");
                },
                error: function (){
                    $("#flash").trigger('error', ['Request error']);
                    self.redirect("#!/cancel2");
                }
            });
        });

    });

    messages.run();
});