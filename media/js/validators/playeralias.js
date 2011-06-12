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

        var name = $.trim(self.val());
        var re = /[@/\s:]/;

        if (name.length < 3)
        {
            fstat.trigger("bad", ["Must be at least 3 characters long."]);
        }
        else if (name.match(re)){
            fstat.trigger("bad", ["Contains invalid characters."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    });

    validators.run("#name");
});