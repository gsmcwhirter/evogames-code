validators.newspost = function (required_fields){
    var self = this;
    
    this.fetch_slugs = function (callback, force) {
        if (!this.slug_cache || force)
        {
            $.get("/api/slugs.json", function (data){
                callback(_.map(data, function (item){return item.toLowerCase();}));
            });
        }
        else
        {
            callback(this.slug_cache);
        }
    };
    
    this.slug_exists = function (slug) {
        if (!this.slug_cache)
        {
            return true;

        }
        else
        {
            if ($.inArray($.trim(slug).toLowerCase(), this.slug_cache) >= 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    };
    
    this.slug_cache = false;
    
    this.slug_cache_loaded = function (){
        return this.slug_cache ? true : false;
    };
    
    this.bind = function (field) {
        $("#"+field).bind('blur keyup',{field: field}, this.validate);
        this.validate({data: {field: field}});
    };
    
    this.slug_chars = "abcdefghijklmnopqrstuvwxyz0123456789- ";
    
    this.sub_to_slug = function (sub) {
        sub = _(sub.toLowerCase().split("")).select(function (item){ return self.slug_chars.indexOf(item) > -1; });
        return sub.join("").replace(/\s{2,}/g, " ").replace(/ /g,"-");
    };
    
    this.slug_entered = false;
    
    this.validate = function (event) {
        var field = event.data.field;
        var sid = "#"+field+"_status"; 
        switch(field)
        {
            case "subject":
                var sub = $.trim($("#"+field).val());
                if (!self.slug_entered) $("#slug").val(self.sub_to_slug(sub));
                
                if (sub.length < 1)
                {
                    self.set_status_bad(sid, "Must be at least 1 character long.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "slug":
                var slug = $.trim($("#"+field).val());
                if (slug != "")
                {
                    self.slug_entered = true;
                }
                
                if (slug.length < 1)
                {
                    self.set_status_bad(sid, "Must be at least 1 character long.");
                    self.set_tooltip(field);
                }
                else if (slug.length > 50)
                {
                    self.set_status_bad(sid, "Must be at most 50 characters long.");
                    self.set_tooltip(field);
                }
                else if (!slug.match(new RegExp("^[a-z0-9\\-]*$")))
                {
                    self.set_status_bad(sid, "Must contain only lowercase letters, numbers, and hyphens.");
                    self.set_tooltip(field);
                }
                else if (self.slug_exists(slug) && slug != $("#saved-slug").val())
                {
                    self.set_status_bad(sid, "Must be unique.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            case "tags":
                /*var tags = [];
                $.trim($("#"+field).val()).split(",").forEach(function (item){
                    tags.push(item.split(";"));
                });
                tags = _(tags).chain().flatten().map(function (item){return $.trim(item);}).value();*/
                var tags = $.trim($("#"+field).val());
                if (!tags.match(new RegExp("^[a-zA-Z0-9\\-_.:/,; ]*$")))
                {
                    self.set_status_bad(sid, "Contains invalid characters.");
                    self.set_tooltip(field);
                }
                else
                {
                    self.set_status_ok(sid, "OK");
                    self.set_tooltip(field);
                }
                break;
            default:
                self.set_tooltip(field);
        }
    }
    
    this.fetch_slugs(function (slugs){
        self.slug_cache = slugs;
        required_fields.forEach(function (item){
            self.bind(item);
        });
    });
};

validators.newspost.prototype = new validators.validator();
validators.newspost.prototype.constructor = validators.newspost;
