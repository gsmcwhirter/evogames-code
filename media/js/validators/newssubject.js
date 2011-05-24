$("#subject").evently({
    _init: function (){
        var self = $(this);
        $(function (){self.trigger("validate");});
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        var slug_chars = "abcdefghijklmnopqrstuvwxyz0123456789- ";
        
        function sub_to_slug(sub){
            sub = _(sub.toLowerCase().split("")).select(function (item){ return slug_chars.indexOf(item) > -1; });
            return sub.join("").replace(/\s{2,}/g, " ").replace(/ /g,"-");
        }
        
        var sub = $.trim(self.val());
        $("#slug").trigger("autoslug", [sub_to_slug(sub)]);
        
        if (sub.length < 1)
        {
            fstat.trigger("bad", ["Must be at least 1 character long."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
