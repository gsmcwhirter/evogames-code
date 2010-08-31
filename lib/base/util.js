var crypto = require('crypto');

var sha1_hex = function (content){
    return crypto.createHash('sha1').update(content).digest('hex');
};

// Convert a options object to an url query string.
  // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
var encodeOptions = function (options) {
    var buf = []
    if (typeof(options) == "object" && options !== null) {
      for (var name in options) {
        if (!options.hasOwnProperty(name)) { continue };
        var value = options[name];
        if (name == "key" || name == "startkey" || name == "endkey") {
          value = toJSON(value);
        }
        buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
      }
    }
    if (!buf.length) {
      return "";
    }
    return "?" + buf.join("&");
}

var toJSON = function (obj) {
    return obj !== null ? JSON.stringify(obj) : null;
}

module.exports.sha1_hex = sha1_hex;
module.exports.encodeOptions = encodeOptions;
module.exports.toJSON = toJSON;
