$("#join_type").evently({
    _init: function (){
        var self = $(this);
        $(function (){self.trigger("validate");});
    },

    change: "validate",
    blur: "validate",

    "validate": function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var typ = $.trim(self.val());
        var valid_types = ["open","approval", "invite"];
        if ($.inArray(typ, valid_types) < 0)
        {
            fstat.trigger("bad", ["You must select a valid joining policy."]);
        }
        else
        {
            fstat.trigger("ok");
        }

    }
});
