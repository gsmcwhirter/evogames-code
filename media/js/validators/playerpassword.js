$(function (){
    $("#password").bind('run', function (){
        $(this).trigger("validate");
        return false;
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
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
    });

    $("#password_confirm").bind('run', function (){
        $(this).trigger("validate");
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
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
    });

    validators.run("#password", "#password_confirm");
});