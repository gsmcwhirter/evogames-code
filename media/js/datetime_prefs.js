var datetime_prefs = {
    country_tzs: {},
    all_tzs: [],
    init: function (){
        var tzsel = "#timezone";
        var self = this;
        $.get("/api/timezones.json", function (data){
            self.country_tzs = data.country_tzs;
            self.all_tzs = data.all_tzs;
            
            var tmp;
            for (var i in self.country_tzs){
                tmp = self.country_tzs[i];
                self.country_tzs[i] = [];
                tmp.forEach(function (tz){
                    self.country_tzs[i].push([tz.substring(tz.indexOf("/")+1).replace(/_/g, " "), tz]);
                });
                
                self.country_tzs[i].sort();
            }
            
            var ccode;
            for (var cname in data.countries){
                ccode = data.countries[cname];
                $("#country").append($("<option />").attr('value',ccode).text(cname));
            }
            
            $("#country").bind('change', {tzsel: tzsel}, function (event){ self.country_change(event); });
            
            $("#country-filter").show();
        });
        
        $("#date_format, #time_format, #datetime_format").each(function (index, item){
            item = $(item);
            item.bind('change', {id: item.attr('id'), tzsel: tzsel}, self.format_change);
            item.change();
        });
        
        $(tzsel).bind('change', function (event){
            $("#date_format, #time_format, #datetime_format").each(function (index, item){
                $(item).change();
            });
        });
    },
    format_change: function (event){
        var item = $("#"+event.data.id);
        
        var type = event.data.id.substring(0, event.data.id.length - 7);
        $.get("/api/format_date.json",{format: item.val(), timezone: $(event.data.tzsel).val()}, function (data){
            $("span#current-"+type).html(data.formatted_date);
        });
    },
    country_change: function (event){
        var item = $(event.target);
        var tzsel = $(event.data.tzsel);
        var ccode = item.val();
        var timezone_sel = tzsel.val();
        
        tzsel.empty();
        tzsel.append("<option value='0'>Please select...</option>");
        if (this.country_tzs[ccode])
        {
            var codes = this.country_tzs[ccode];
            codes.forEach(function (code){
                tzsel.append($("<option />").attr("value", code[1]).text(code[0]));
            });
        }
        else
        {
            this.all_tzs.forEach(function (tz){
                tzsel.append($("<option />").attr("value", tz).text(tz));
            });
        }
    }

};
