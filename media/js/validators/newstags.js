$("#tags").evently({
    _init: function (){
        var self = $(this);
        $(function (){self.trigger("validate");});
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var tags = $.trim(self.val());
        if (!tags.match(new RegExp("^[a-zA-Z0-9\\-_.:/,; ]*$")))
        {
            fstat.trigger("bad", ["Contains invalid characters."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
