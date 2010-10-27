$("#name").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var name = $.trim(self.val());
        if (name.length < 3)
        {
            fstat.trigger("bad", ["Must be at least 3 characters long."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
