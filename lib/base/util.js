var crypto = require('crypto');
var qs = require('querystring');

var sha1_hex = function (content){
    return crypto.createHash('sha1').update(content).digest('hex');
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

module.exports.sha1_hex = sha1_hex;
module.exports.encodeOptions = encodeOptions;
