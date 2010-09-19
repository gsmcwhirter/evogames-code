var crypto = require('crypto');
var qs = require('querystring');

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
            if (name == "key" || name == "startkey" || name == "endkey" || name == "include_docs"){
                options[name] = (val !== null) ? JSON.stringify(val) : null;
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

module.exports.sha1_hex = sha1_hex;
module.exports.md5_hex = md5_hex;
module.exports.encodeOptions = encodeOptions;
module.exports.randomString = randomString;
