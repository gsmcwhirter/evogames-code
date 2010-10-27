$("#email").evently({
    _init: function (){
        var self = $(this);
        
        self.trigger("fetch_emails", [function (emails){
            self.trigger("validate");
        }]);
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();
        
        function email_exists(email){
            if (!$$(self).email_cache)
            {
                return true;
            }
            
            if ($.inArray(hex_sha1($.trim(email).toLowerCase()), $$(self).email_cache) >= 0)
            {
                return true;
            }
            
            return false;
        }
        
        function email_cache_loaded(){
            return $$(self).email_cache ? true : false;
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
    },
    
    "fetch_emails": function (e, callback, force){
        var self = $(this);
        
        if (!$$(self).email_cache || force)
        {
            $.get("/api/emails.json", function (data){
                $$(self).email_cache = data;
                callback(data);
            });
        }
        else
        {
            return $$(self).email_cache;
        }
    }
});

$("#email_confirm").evently({
    _init: function (){
        var self = $(this);
        $(document).ready(function (){ self.trigger("validate"); });
    },
    
    keyup: "validate",
    blur: "validate",
    
    "validate": function (){
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
    }
});
