$(function(){
    var dtprefs = $.sammy("#dtprefs", function (){
        this.setLocationProxy({bind: function (){}, unbind: function (){}, getLocation: function (){return '';}, setLocation: function (){}});
        this.get('', function (){});

        var country_tzs = {};
        var all_tzs = {};
        var _app = this;

        this.bind('run', function (){
            this.$element("#country").bind("load-countries", function(e, countries){
                var self = $(this);
                for (var cname in countries){
                    self.append($("<option />").attr('value', countries[cname]).text(cname));
                }
            }).bind("change", function (){
                _app.$element("#timezone").trigger("relist", [$(this).val()]);
            });

            this.$element("#date_format, #time_format, #datetime_format").bind("change", function (){
                var self = $(this);

                var type = self.attr('id').substring(0, self.attr('id').length - 7);
                $.get("/api/format_date.json",{format: self.val(), timezone: _app.$element("#timezone").val()}, function (data){
                    _app.$element("span#current-"+type).html(data.formatted_date);
                });
            });

            this.$element("#timezone").bind("change", function (){
                _app.$element("#date_format, #time_format, #datetime_format").trigger("change");
            }).bind("relist", function (e, ccode){
                var self = $(this);
                var current = self.val();

                self.empty();
                self.append("<option value='0'>Please select...</option>");
                if (country_tzs[ccode]){
                    (country_tzs[ccode]).forEach(function (code){
                        self.trigger("add-tz-option", [code[1], code[0]]);
                    });
                }
                else {
                    (all_tzs).forEach(function (tz){
                        self.trigger("add-tz-option", [tz, tz]);
                    });
                }

                self.val(current);
            }).bind("add-tz-option", function (e, val, text){
                $(this).append($("<option />").attr("value", val).text(text));
            });

            $.get("/api/timezones.json", function (data){
                country_tzs = data.country_tzs;
                all_tzs = data.all_tzs;

                var tmp;
                for (var i in country_tzs){
                    tmp = country_tzs[i];
                    country_tzs[i] = [];
                    tmp.forEach(function (tz){
                        country_tzs[i].push([tz.substring(tz.indexOf("/")+1).replace(/_/g, " "), tz]);
                    });

                    country_tzs[i].sort();
                }

                _app.$element("#country").trigger("load-countries", [data.countries]);
                _app.$element("#country-filter").show();
            }, "json");

            this.$element("#date_format, #time_format, #datetime_format").trigger("change");
        });
    });

    dtprefs.run();
});
