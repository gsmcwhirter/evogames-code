$(function (){
    $("#startdate_date, #startdate_time, #enddate_date, #enddate_time").bind('run', function (){
        $(this).trigger("validate");
        return false;
    }).bind("keyup", function (){
        $(this).trigger("validate");
    }).bind("blur", function (){
        $(this).trigger("validate");
    }).bind("click", function (){
        $(this).trigger("validate");
    }).bind("validate", function (e, all){
        if (!all){
            $("#startdate_date, #startdate_time, #enddate_date, #enddate_time").trigger("validate", true);
        }

        var self = $(this);
        var fstat = self.parent().find(".field-status").first();

        var datestr = {};
        var date = {};
        datestr.start = $.trim($.trim($("#startdate_date").val()) + " " + $.trim($("#startdate_time").val()));
        date.start = new Date(datestr.start);
        datestr.end = $.trim($.trim($("#enddate_date").val()) + " " + $.trim($("#enddate_time").val()));
        date.end = new Date(datestr.end);

        var id = self.attr('id');
        var myid = id.substring(0, id.length - 9);

        if (datestr[myid] && !date[myid])
        {
            fstat.trigger("bad", ["Date and time have invalid format."]);
        }
        else if (datestr["start"] && datestr["end"] && date["end"] && date["start"] >= date["end"]){
            fstat.trigger("bad", ["Start date must be before end date."]);
        }
        else if (datestr["end"] && !datestr["start"] && $("#startdate_date, #startdate_time").length > 0){
            fstat.trigger("bad", ["You must list both a start and end date, just a start date, or neither."]);
        }
        else
        {
            fstat.trigger("ok");
        }
    });

    validators.run("#startdate_date, #startdate_time, #enddate_date, #enddate_time");
});
