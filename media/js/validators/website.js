$("#website").evently({
    _init: function (){
        var self = $(this);

        $(function(){self.trigger("validate");});
    },

    keyup: "validate",
    blur: "validate",

    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        //The follow regex is from http://daringfireball.net/2010/07/improved_regex_for_matching_urls
        var re = new RegExp("(?:^$)|(?:^(?:https?://|www\\d{0,3}[.]|[a-z0-9.\\-]+[.][a-z]{2,4}/)(?:[^\\s()<>]+|\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\))+(?:\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[\\]{};:'\".,<>?]))$", "i")

        var website = $.trim(self.val());
        if (!website.match(re))
        {
            fstat.trigger("bad", ["Has invalid format."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }
});
