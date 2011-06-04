$(function (){
    var gametype_cache;

    $("#gametype_name").bind('run', function (){
        var self = $(this);
        self.trigger("fetch-gametypes", [function (gametypes){
            gametype_cache = gametypes;
            self.trigger("validate");
        }]);
        return false;
    }).bind("change", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        function gametype_exists(gametype){
            if(!gametype_cache)
            {
                return true;
            }

            if($.inArray(gametype.toLowerCase(), gametype_cache) >= 0)
            {
                return true;
            }

            return false;
        }

        function gametype_cache_loaded(){
            return gametype_cache ? true : false;
        }

        var gametype = self.val();
        if (!gametype_exists(gametype) && gametype != "other")
        {
            fstat.trigger("bad", ["Must either be an existing gametype or \"Custom\"."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }).bind("fetch-gametypes", function (e, callback, force){
        if (!gametype_cache || force)
        {
            $.get("/api/games/"+GAME_CODE+"/gametypes.json", function (data){
                callback(data);
            });
        }
        else
        {
            callback(gametype_cache);
        }
    });

    validators.run("#gametype_name");
});