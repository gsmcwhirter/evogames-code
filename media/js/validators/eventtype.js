$(function (){
    $("#event_type").bind('run', function (){
        $(this).trigger("validate");
        return false;
    }).bind("change", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var typ = $.trim(self.val());
        var valid_types = ["group_register","player_register"];
        if ($.inArray(typ, valid_types) < 0)
        {
            fstat.trigger("bad", ["You must select a valid event type."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    });

    validators.run("#event_type");
});