$("#code").evently({
    _init: function (){
        var self = $(this);
        self.trigger("fetch_codes", [function (codes){
            self.trigger("validate");
        }]);
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        
        function code_exists(code){
            if(!$$(self).code_cache)
            {
                return true;
            }
            
            if($.inArray($.trim(code).toLowerCase(), $$(self).code_cache) >= 0)
            {
                return true;
            }
                
            return false;
        }
        
        function code_cache_loaded(){
            return $$(self).code_cache ? true : false;
        }
        
        var fstat = self.parent().find(".field-status").first();
        
        var re = new RegExp("^[a-zA-Z0-9\\-_\\[\\]]*$");
        var code = $.trim(self.val());
        if (code.length == 0)
        {
            fstat.trigger("bad", ["Must not be empty."]);
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
        
    },
    
    "fetch_codes": function (e, callback, force){
        var self = $(this);
        if (!$$(self).code_cache || force)
        {
            $.get("/api/group_codes.json", function (data){
                $$(self).code_cache = data;
                callback(data);
            });
        }
        else
        {
            callback($$(self).code_cache);
        }
    }
});
