$("#password").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var re = new RegExp("[^a-zA-Z]");
        var password = $.trim(self.val());
        if (password.length < 8)
        {
            fstat.trigger("bad", ["Must be at least 8 characters long."]);
        }
        else if (!password.match(re))
        {
            fstat.trigger("bad", ["Must contain at least one non-letter."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});

$("#password_confirm").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var password_confirm = $.trim(self.val());
        if (password_confirm != $.trim($("#password").val()))
        {
            fstat.trigger("bad", ["Must match password."]);
        }
        else if (password_confirm == '')
        {
            fstat.trigger("bad", ["Must not be empty."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
