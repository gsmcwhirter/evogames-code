module.exports.group = {
    type: "object",
    properties: {
        "type": {
            "enum": ["group"],
            "default": "group"
        },
        "name": {
            type: "string",
            minLength: 1
        },
        "code": {
            type: "string",
            minLength: 1,
            pattern: {pattern: "^[a-zA-Z0-9\\-_\\[\\]]*$", message: "contains invalid characters"}
        },
        "description": {
            type: "string",
            optional: true
        },
        "owners": {
            type: "array",
            minItems: 1,
            items: {
                type: "string",
                minLength: 1
            }
        }
    }
}
