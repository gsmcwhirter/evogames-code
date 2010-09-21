var datetime_prefs = {
    init: function (){
        $.get("/api/timezones.json", function (data){
            
        });
        
        $("#date_format, #time_format, #datetime_format").each(function (index, item){
            item = $(item);
            item.bind('change',{id: item.attr('id')}this.format_change);
            item.change();
        });
    },
    format_change: function (event){
        var item = $("#"+event.data.id);
        
        var type = item.substring(-7);
        $.get("/api/format_date.json",{format: item.val(), timezone: $("#timezone").val()}, function (data){
            $("span#current-"+type).html(data.formatted_date);
        });
    }

};
