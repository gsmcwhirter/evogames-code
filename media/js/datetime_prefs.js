$("#timezone").evently({
    _init: function (){
        var self = $(this);
        $$(self).country_tzs = {};
        $$(self).all_tzs = {};
        $.get("/api/timezones.json", function (data){
            $$(self).country_tzs = data.country_tzs;
            $$(self).all_tzs = data.all_tzs;
            
            var tmp;
            for (var i in $$(self).country_tzs){
                tmp = $$(self).country_tzs[i];
                $$(self).country_tzs[i] = [];
                tmp.forEach(function (tz){
                    $$(self).country_tzs[i].push([tz.substring(tz.indexOf("/")+1).replace(/_/g, " "), tz]);
                });
                
                $$(self).country_tzs[i].sort();
            }
            
            $("#country").trigger("load_countries", [data.countries]);
            $("#country-filter").show();
        });
    },
    
    change: function (){
        $("#date_format, #time_format, #datetime_format").trigger("change");
    },
    
    "relist": function (e, ccode){
        var self = $(this);
        var current = self.val();
        
        self.empty();
        self.append("<option value='0'>Please select...</option>");
        if ($$(self).country_tzs[ccode]){
            ($$(self).country_tzs[ccode]).forEach(function (code){
                self.trigger("add_tz_option", [code[1], code[0]]);
            });    
        }
        else {
            ($$(self).all_tzs).forEach(function (tz){
                self.trigger("add_tz_option", [tz, tz]);
            });
        }
        
        self.val(current);
    },
    
    "add_tz_option": function (e, val, text){
        $(this).append($("<option />").attr("value", val).text(text));
    }
});

$("#country").evently({
    change: function (){
        var self = $(this);
        $("#timezone").trigger("relist", [self.val()]);
    },
    
    "load_countries": function (e, countries){
        var self = $(this);
        for (var cname in countries){
            self.append($("<option />").attr('value', countries[cname]).text(cname));
        }
    }
});

$("#date_format, #time_format, #datetime_format").evently({
    _init: function (){
        $(this).trigger("change");
    },
    
    change: function (){
        var self = $(this);
        
        var type = self.attr('id').substring(0, self.attr('id').length - 7);
        $.get("/api/format_date.json",{format: self.val(), timezone: $("#timezone").val()}, function (data){
            $("span#current-"+type).html(data.formatted_date);
        });
    }
});
