$("#type").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    blur: "validate",
    change: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var typ = $.trim(self.val());
        var valid_types = ["bug report","feature request", "other"];
        if ($.inArray(typ, valid_types) < 0)
        {
            fstat.trigger("bad", ["You must select an issue type."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
