$("#handle").evently({
    _init: function (){
        var self = $(this);
        
        self.trigger("fetch_users", [function (users){
            self.trigger("validate");
        }]);
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        function user_exists(name){
            if(!$$(self).user_cache)
            {
                return true;
            }
            
            if ($.inArray($.trim(name).toLowerCase(), $$(self).user_cache) >= 0)
            {
                return true;
            }
            
            return false;
        }
        
        function user_cache_loaded(){
            return $$(self).user_cache ? true : false;
        }
        
        var handle = $.trim(self.val());
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
        else
        {
            fstat.trigger("ok");
        }
    },
    
    "fetch_users": function (e, callback, force){
        var self = $(this);
        if (!$$(self).user_cache || force)
        {
            $.get("/api/users.json", function (data){
                $$(self).user_cache = _.map(data, function (item){return item.toLowerCase();}); 
                callback($$(self).user_cache);
            });
        }
        else
        {
            callback($$(self).user_cache);
        }
    }
});
