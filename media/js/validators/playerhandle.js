$(function (){
    var user_cache;

    $("#handle").bind('run', function (){
        var self = $(this);
        self.trigger("fetch-users", [function (users){
            user_cache = users;
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

        function user_exists(name){
            if(!user_cache)
            {
                return true;
            }

            if ($.inArray($.trim(name).toLowerCase(), user_cache) >= 0)
            {
                return true;
            }

            return false;
        }

        function user_cache_loaded(){
            return user_cache ? true : false;
        }

        var handle = $.trim(self.val());
        var re = /[@/\s]/;

        if (handle.length < 3)
        {
            fstat.trigger("bad", ["Must be at least 3 characters long."]);
        }
        else if (user_exists(handle))
        {
            if (!user_cache_loaded())
            {
                fstat.trigger("maybe", ["May not be unique."]);
            }
            else
            {
                fstat.trigger("bad", ["Must be unique."]);
            }
        }
        else if (handle.match(re)){
            fstat.trigger("bad", ["Contains invalid characters."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }).bind("fetch-users", function (e, callback, force){
        if (!user_cache || force)
        {
            $.get("/api/users.json", function (data){
                var users = _.map(data, function (item){return item.toLowerCase();});
                callback(users);
            });
        }
        else
        {
            callback(user_cache);
        }
    });

    validators.run("#handle");
});
