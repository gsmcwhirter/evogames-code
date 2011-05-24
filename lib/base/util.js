var crypto = require('crypto');
var qs = require('querystring');

var sha1_hex = function (content){
    return crypto.createHash('sha1').update(content).digest('hex');
};

// Convert a options object to an url query string.
  // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
var encodeOptions = function (options) {
    var ct;
    if (typeof(options) == "object" && options !== null) {
        for (var name in options) {
            if (!options.hasOwnProperty(name)) { continue };
            ct++;
            if (name == "key" || name == "startkey" || name == "endkey") {
                options[name] = options[name] !== null ? JSON.stringify(options[name]) : null;
            }
      }
      
      
    }
    
    return "?" + qs.stringify(options);
}

module.exports.sha1_hex = sha1_hex;
module.exports.encodeOptions = encodeOptions;
