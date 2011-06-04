$(function (){
    $("#name").bind('run', function (){
        $(this).trigger("validate");
        return false;
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var slug_chars = "abcdefghijklmnopqrstuvwxyz0123456789-_ ";

        function sub_to_slug(sub){
            sub = _(sub.toLowerCase().split("")).select(function (item){ return slug_chars.indexOf(item) > -1; });
            return sub.join("").replace(/\s{2,}/g, " ").replace(/ /g,"-");
        }

        var sub = $.trim(self.val());
        $("#slug").trigger("autoslug", [sub_to_slug(sub)]);

        if (sub.length < 3)
        {
            fstat.trigger("bad", ["Must be at least 3 characters long."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    });

    validators.run("#name");
});
