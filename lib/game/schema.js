var basestat = module.exports.basestat = {
    type: "object",
    properties: {
        name: {
            type: "string",
            pattern: {pattern: "^[a-zA-Z0-9]*$", message: "contains invalid characters"}
        },
        valtype: {
            "enum": ["integer","float","enum", "string"],
            "default": "integer"
        },
        valdata: {
            type: "string",
            optional: true
        }
    }

};

var calcstat = module.exports.calcstat = {
    type: "object",
    properties: {
        name: {
            type: "string",
            pattern: {pattern: "^[a-zA-Z0-9]*$", message: "contains invalid characters"}
        },
        formula: {
            type: "string",
            minLength: 1
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
        "basestats": {
            type: "array",
            minItems: 1,
            items: basestat
        },
        "calcstats": {
            type: "array",
            optional: true,
            items: calcstat
        }
    }
}

module.exports.game = {
    type: "object",
    properties: {
        "name": {
            type: "string",
            minLength: 3
        },
        "code": {
            type: "string",
            minLength: 3,
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
        "gametypes": {
            type: "array",
            items: gametype
        }
    }
}
