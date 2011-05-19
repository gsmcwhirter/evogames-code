$(function (){
    $("#join_type").bind('run', function (){
        this.trigger("validate");
    }).bind("change", function (){
        this.trigger("validate");
    }).bind("blur", function (){
        this.trigger("validate");
    }).bind("validate", function (){
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
    });
});