$("#slug").evently({
    _init: function (){
        var self = $(this);
        $$(self).autoslug = true;
        $$(self).last_autoslug = "";
        
        self.trigger("fetch_slugs", [function (slugs){
            self.trigger("validate");
        }]);
    },
    
    "keyup": "validate",
    "blur": "validate",
    
    "validate": function (){
        var self = $(this);
        
        function slug_exists(slug){
            if(!$$(self).slug_cache)
            {
                return true;
            }
            
            if ($.inArray($.trim(slug).toLowerCase(), $$(self).slug_cache) >= 0)
            {
                return true;
            }
            
            return false;
        }
        
        function slug_cache_loaded(){
            return $$(self).slug_cache ? true : false;
        }
        
        var slug_chars = "abcdefghijklmnopqrstuvwxyz0123456789- ";
        
        var slug = $.trim(self.val());
        var fstat = self.parent().find(".field-status").first();
        
        if ($$(self).autoslug && slug != $$(self).last_autoslug)
        {
            $$(self).autoslug = false;
        }
        
        if (slug.length < 1)
        {
            fstat.trigger("bad", ["Must be at least 1 character long."]);
        }
        else if (slug.length > 50)
        {
            fstat.trigger("bad", ["Must be at most 50 characters long."]);
        }
        else if (!slug.match(new RegExp("^[a-z0-9\\-]*$")))
        {
            fstat.trigger("bad", ["Must contain only lowercase letters, numbers, and hyphens."]);
        }
        else if (slug_exists(slug) && slug != $("#saved-slug").val())
        {
            fstat.trigger("bad", ["Must be unique."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    },
    
    "autoslug": function (e, newslug){
        var self = $(this);
        if ($$(self).autoslug)
        {
            $$(self).last_autoslug = newslug;
            self.val(newslug);
        }
    },
    
    "fetch_slugs": function (e, callback, force){
        var self = $(this);
        if (!$$(self).slug_cache || force)
        {
            $.get("/api/slugs.json", function (data){
                $$(self).slug_cache = _.map(data, function (item){return item.toLowerCase();});
                callback($$(self).slug_cache);
            });
        }
        else
        {
            callback($$(self).slug_cache);
        }
    }
});
