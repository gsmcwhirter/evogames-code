module.exports.group = {
    type: "object",
    properties: {
        "type": {
            "enum": ["group"],
            "default": "group"
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
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
