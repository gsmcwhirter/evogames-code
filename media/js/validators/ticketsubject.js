$("#subject").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    keyup: "validate",
    blur: "validate",
    change: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var sub = $.trim(self.val());
        if (sub.length < 3)
        {
            fstat.trigger("bad", ["Must be at least 3 characters long."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
