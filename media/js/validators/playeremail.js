$(function (){
    var email_cache;

    $("#email").bind('run', function (){
        var self = $(this);
        self.trigger("fetch-emails",[function (emails){
            email_cache = emails;
            self.trigger("validate");
        }]);
        return false;
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        function email_exists(email){
            if (!email_cache)
            {
                return true;
            }

            if ($.inArray(hex_sha1($.trim(email).toLowerCase()), email_cache) >= 0)
            {
                return true;
            }

            return false;
        }

        function email_cache_loaded(){
            return email_cache ? true : false;
        }

        var re = new RegExp("^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$");
        var email = $.trim(self.val());
        if (email.length == 0)
        {
            fstat.trigger("bad", ["Must not be empty."]);
        }
        else if (!email.match(re))
        {
            fstat.trigger("bad", ["Has invalid format."]);
        }
        else if (email_exists(email))
        {
            if (!email_cache_loaded())
            {
                fstat.trigger("maybe", ["May not be unique."]);
            }
            else
            {
                fstat.trigger("bad", ["Must be unique."]);
            }
        }
        else
        {
            fstat.trigger("ok");
        }
    }).bind("fetch-emails", function (e, callback, force){
        if (!email_cache || force)
        {
            $.get("/api/emails.json", function (data){
                callback(data);
            });
        }
        else
        {
            callback(email_cache)
        }
    });

    $("#email_confirm").bind('run', function (){
        $(this).trigger("validate");
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var email_confirm = $.trim(self.val());
        if (email_confirm != $.trim($("#email").val()))
        {
            fstat.trigger("bad", ["Must match e-mail."]);
        }
        else if (email_confirm == '')
        {
            fstat.trigger("maybe", ["Must not be empty."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    });

    validators.run("#email", "#email_confirm");
});
