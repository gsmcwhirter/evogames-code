$(function (){
    var code_cache;

    $("#code").bind('run', function (){
        var self = $(this);
        self.trigger("fetch-codes", [function (codes){
            code_cache = codes;
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

        function code_exists(code){
            if(!code_cache)
            {
                return true;
            }

            if($.inArray($.trim(code).toLowerCase(), code_cache) >= 0)
            {
                return true;
            }

            return false;
        }

        function code_cache_loaded(){
            return code_cache ? true : false;
        }

        var re = new RegExp("^[a-zA-Z0-9\\-_\\[\\]]*$");
        var code = $.trim(self.val());
        if (code.length < 3)
        {
            fstat.trigger("bad", ["Must be at least 3 characters long."]);
        }
        else if (!code.match(re))
        {
            fstat.trigger("bad", ["Contains invalid characters."]);
        }
        else if (code_exists(code))
        {
            if (!code_cache_loaded())
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
    }).bind("fetch-codes", function (e, callback, force){
        if (!code_cache || force)
        {
            $.get("/api/group_codes.json", function (data){
                callback(data);
            });
        }
        else
        {
            callback(code_cache);
        }
    });

    validators.run("#code");
});