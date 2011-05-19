$(function (){
    var slug_cache;
    var autoslug = false;
    var last_autoslug = "";

    $("#slug").bind('run', function (){
        var self = this;
        this.trigger("fetch-slugs", [function (){
            slug_cache = slugs;
            self.trigger("validate");
        }]);
        this.trigger("validate");
    }).bind("keyup", function (){
        this.trigger("validate");
    }).bind("blur", function (){
        this.trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        function slug_exists(slug){
            if(!slug_cache)
            {
                return true;
            }

            if ($.inArray($.trim(slug).toLowerCase(), slug_cache) >= 0)
            {
                return true;
            }

            return false;
        }

        function slug_cache_loaded(){
            return slug_cache ? true : false;
        }

        var slug = $.trim(self.val());

        if (autoslug && slug != last_autoslug)
        {
            autoslug = false;
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
    }).bind("fetch-slugs", function (e, callback, force){
        if (!slug_cache || force)
        {
            $.get("/api/slugs.json", function (data){
                var slugs = _.map(data, function (item){return item.toLowerCase();});
                callback(slugs);
            });
        }
        else
        {
            callback(slug_cache);
        }
    }).bind("autoslug", function (e, newslug){
        if (autoslug){
            last_autoslug = newslug;
            $(this).val(newslug);
        }
    }).trigger("run");
});