var crypto = require('crypto'),
    qs = require('querystring'),
    zoneinfo = require('zoneinfo'),
    SMTP = require('../smtp'),
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
    	for(var name in options){
    		var val = options[name];
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
    	}
    }
    
    return "?" + qs.stringify(options);
};

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

var gravatar_url = function (email, size){
    email = email + "";
    size = size || 64;
    return "https://secure.gravatar.com/avatar/" +
        md5_hex(email.trim().toLowerCase()) +
        "?r=pg&s=" + size
};

var send_email = function (res, template, data, maildata, callback){
    res.render(template, data, function (err, mail_body){
        if (err){
            callback(false, err);
        }
        else {
            var smtp = res.app.set('smtp');

            maildata.body = mail_body;
            maildata.from = maildata.from || "EvoGames System";

            smtp.send(maildata, callback);
        }
    });
};

var safeRedirect = function (to){
    var url = require('url');
    ref_parse = url.parse(to);
    switch (ref_parse.pathname){
        case "/player/confirm_email":
        case "/logout":
        case "/login":
        case "/player/register":
        case "/player/lostpass":
            return "/";
            break;
        default:
            return to;
            break;
    }
};

var inParallel = function (){
    var tasks = arguments;
    var final_callback = tasks[tasks.length - 1];

    var maxdone = tasks.length - 1;

    function callback(){
        maxdone--;
        if (maxdone == 0){
            final_callback();
        }
    }

    if (tasks.length == 1){
        final_callback();
    }
    else {
        for (var i = 0; i < tasks.length - 1; i++){
            tasks[i](callback);
        }
    }
}

module.exports = {
    sha1_hex: sha1_hex,
    md5_hex: md5_hex,
    encodeOptions: encodeOptions,
    randomString: randomString,
    date: date,
    timezones: timezones,
    gravatar_url: gravatar_url,
    send_email: send_email,
    safeRedirect: safeRedirect,
    inParallel: inParallel
};
