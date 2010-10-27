$("#agreement").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    click: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().parent().find(".field-status").first();
        
        if (!self.is(":checked"))
        {
            fstat.trigger("bad", ["You must agree."]);
        }
        else
        {
            fstat.trigger("ok");
        }
        
        return true;
    }
});
