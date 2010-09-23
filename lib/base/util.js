var crypto = require('crypto'),
    qs = require('querystring'),
    zoneinfo = require('../node-zoneinfo/lib/zoneinfo'),
    TZDate = zoneinfo.TZDate;

var sha1_hex = function (content){
    return crypto.createHash('sha1').update(content).digest('hex');
};

var md5_hex = function (content){
    return crypto.createHash('md5').update(content).digest('hex');
};

// Convert a options object to an url query string.
  // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
var encodeOptions = function (options) {
    if (typeof(options) == "object" && options !== null) {
        options.forEach(function(val, name){
            if (!options.hasOwnProperty(name)) continue;
            switch (name){
                case "key":
                case "startkey":
                case "endkey":
                case "include_docs":
                case "descending":
                case "reduce":
                case "group":
                    options[name] = (val !== null) ? JSON.stringify(val) : null;
                    break;
                default:
                    break;
            }
        });
      
    }
    
    return "?" + qs.stringify(options);
}

var randomString = function (length, use_symbols){
    length = length || 12;
    use_symbols = use_symbols || false;

    var chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789!@$";
    var symbols = "#%^&*()-_=+[]{}\|<>,./?;:";
    
    if (use_symbols) chars = chars + symbols;
    
    var str = "";
    for (x=0; x<length; x++){
        i = Math.floor(Math.random() * chars.length);
        str += chars.charAt(i);
    }
    return str;
}

var date = function(string_or_int, timezone){
    if (string_or_int == "now") string_or_int = null;
    var d = new TZDate(string_or_int);
    if (timezone && zoneinfo.isTimezone(timezone)) d.setTimezone(timezone);
    return d;
};

var timezones = function (country_code){
    return zoneinfo.listTimezones(country_code);
};

module.exports.sha1_hex = sha1_hex;
module.exports.md5_hex = md5_hex;
module.exports.encodeOptions = encodeOptions;
module.exports.randomString = randomString;
module.exports.date = date;
module.exports.timezones = timezones;
