$(function (){
    $("#tags").bind('run', function (){
        this.trigger("validate");
    }).bind("keyup", function (){
        this.trigger("validate");
    }).bind("blur", function (){
        this.trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var tags = $.trim(self.val());
        if (!tags.match(new RegExp("^[a-zA-Z0-9\\-_.:/,; ]*$")))
        {
            fstat.trigger("bad", ["Contains invalid characters."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    }).trigger("run");
});