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
    var d = new TZDate(string_or_int, timezone);
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

var slugify = function (str){
    var slug_chars = "abcdefghijklmnopqrstuvwxyz0123456789- ";
    var sub = str.toLowerCase().split("").filter(function (item){ return slug_chars.indexOf(item) > -1; });
    return sub.join("").replace(/\s{2,}/g, " ").replace(/ /g,"-");
}

var clone = function (object, nondeep){
    /**
     * Adopted from jquery's extend method. Under the terms of MIT License.
     *
     * http://code.jquery.com/jquery-1.4.2.js
     *
     * Modified by Brian White to use Array.isArray instead of the custom isArray method
     */
    function extend() {
      // copy reference to target object
      var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

      // Handle a deep copy situation
      if (typeof target === "boolean") {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
      }

      // Handle case when target is a string or something (possible in deep copy)
      if (typeof target !== "object" && !typeof target === 'function')
        target = {};

      var isPlainObject = function(obj) {
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if (!obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval)
          return false;

        var has_own_constructor = hasOwnProperty.call(obj, "constructor");
        var has_is_property_of_method = hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf");
        // Not own constructor property must be Object
        if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
          return false;

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.

        var last_key;
        for (key in obj)
          last_key = key;

        return typeof last_key === "undefined" || hasOwnProperty.call(obj, last_key);
      };


      for (; i < length; i++) {
        // Only deal with non-null/undefined values
        if ((options = arguments[i]) !== null) {
          // Extend the base object
          for (name in options) {
            src = target[name];
            copy = options[name];

            // Prevent never-ending loop
            if (target === copy)
                continue;

            // Recurse if we're merging object literal values or arrays
            if (deep && copy && (isPlainObject(copy) || Array.isArray(copy))) {
              var clone = src && (isPlainObject(src) || Array.isArray(src)) ? src : Array.isArray(copy) ? [] : {};

              // Never move original objects, clone them
              target[name] = extend(deep, clone, copy);

            // Don't bring in undefined values
            } else if (typeof copy !== "undefined")
              target[name] = copy;
          }
        }
      }

      // Return the modified object
      return target;
    }

    if (nondeep){
        return extend({}, object);
    }
    else {
        return extend(true, {}, object);
    }

};

var uniq = function(array, isSorted) {
    return array.reduce(function(memo, el, i) {
        if (0 == i || (isSorted === true ? memo[memo.length - 1] != el : memo.indexOf(el) == -1)) memo[memo.length] = el;
        return memo;
    }, []);
};

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
    inParallel: inParallel,
    slugify: slugify,
    clone: clone,
    uniq: uniq
};
