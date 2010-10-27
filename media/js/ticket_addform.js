$("#new-ticket-form").evently({
    _init: {
        selectors: {
            "button#cancel": {
                click: function (){
                    $("#new-ticket-form").trigger("hide");
                    $("#new-ticket-link").trigger("show");
                }
            },
            "#subject": {
                "clear": function (){
                    $(this).val('');
                }
            },
            "#type": {
                "clear": function (){
                    $(this).val('-');
                }
            },
            "#body": {
                "clear": function (){
                    $(this).val('');
                }
            }
        }
    },
    
    submit: function (){
        var self = $(this);
        
        $.ajax({
            type: 'put',
            url: '/issues/add',
            data: self.serialize(),
            dataType: 'json',
            processData: false,
            success: function (data, textStatus){
                if (data.ok){
                    $("#flash").trigger('info', ['Ticket added successfully.']);
                    $(".tickets#nonclosed").trigger("add", [data.ticket]);
                    
                    $("#new-ticket-form").trigger("hide");
                }
                else {
                    $("#flash").trigger('error', ['Ticket not added: '+data.error]);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown){
                $("#flash").trigger('error', ['Request error']);
            }
        });
        
        return false;
    },
    
    "show": function (){
        var self = $(this);
        $("#subject", self).trigger("clear");
        $("#type", self).trigger("clear");
        $("#body", self).trigger("clear");
        self.show();
        $("#subject", self).focus();
    },
    
    "hide": function (){
        var self = $(this);
        self.hide();
    }
});

$("#new-ticket-link").evently({
    click: function (){
        var self = $(this);
        $("#new-ticket-form").trigger("show");
        self.trigger("hide");
        
        return false;
    },
    "show": function (){
        $(this).show();
    },
    "hide": function (){
        $(this).hide();
    }
});
