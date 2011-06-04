$(function (){
    $("#minTeams").bind('run', function (){
        $(this).trigger("validate");
        return false;
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("click", function (){
        $(this).trigger("validate");
    }).bind("validate", function (){
        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var minTeams = $.trim(self.val());
        if (parseFloat(minTeams) != parseInt(minTeams))
        {
            fstat.trigger("bad", ["Must be an integer."]);
        }
        else if (parseInt(minTeams) <= 0){
            fstat.trigger("bad", ["Must be at least 1."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    });

    validators.run("#minTeams");
});