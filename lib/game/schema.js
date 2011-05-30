var statnamepattern = "^[a-zA-Z0-9]*$";

var stat = module.exports.stat = {
    type: "object",
    properties: {
        name: {
            type: "string",
            pattern: {pattern: statnamepattern, message: "contains invalid characters"}
        },
        valtype: {
            "enum": ["integer","float","enum", "string","formula"],
            "default": "integer"
        },
        valdata: {
            type: "string",
            optional: true
        }
    }

};

var rating = module.exports.rating = {
    type: "object",
    properties: {
        "name": {
            type: "string",
            pattern: {pattern: statnamepattern, message: "contains invalid characters"}
        },
        "weight": {
            type: "number",
            maxDecimal: 2
        }
    }
    
}

var gametype = module.exports.gametype = {
    type: "object",
    properties: {
        "name": {
            type: "string",
            minLength: 3,
            pattern: {pattern: "^[a-zA-Z0-9\\-_]*$", message: "contains invalid characters"}
        },
        "stats": {
            type: "array",
            minItems: 1,
            items: stat
        },
        "rating": {
            type: "array",
            minItems: 1,
            items: rating
        }
    }
}

module.exports.game = {
    type: "object",
    properties: {
        "name": {
            type: "string",
            minLength: 2
        },
        "code": {
            type: "string",
            minLength: 2,
            pattern: {pattern: "^[a-zA-Z0-9\\-_\\[\\]]*$", message: "contains invalid characters"}
        },
        "genres": {
            type: "array",
            optional: true,
            items: {
                type: "string",
                minLength: 3
            }
        },
        "description": {
            type: "string",
            optional: true
        },
        "gametypes": {
            type: "array",
            items: gametype
        }
    }
}
