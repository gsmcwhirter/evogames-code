module.exports.player = {
    type: "object",
    properties: {
        "type": {
            "enum": ["player"],
            "default": "player"
        },
        "handle": {
            type: "string",
            minLength: 3,
            pattern: {pattern: "^[a-zA-Z0-9\\-_]*$", message: "contains invalid characters."}
        },
        "aliases": {
            type: "array",
            minItems: 1,
            items: {
                type: "string",
                minLength: 3,
                pattern: {pattern: "[@/\\s]", message: "contains invalid characters.", negative: true}
            }
        },
        "email_history": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "email": {
                        type: "string",
                        pattern: "^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$"
                    },
                    "date": {
                        type: "string",
                        minLength: "0000-00-00T00:00:00.000Z".length,
                        maxLength: "0000-00-00T00:00:00.000Z".length,
                        pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
                    }
                }
            }
        },
        "password": {
            type: "string",
            minLength: 8,
            pattern: {pattern: "[^a-zA-Z]", message: "must contain at least one non-letter."}
        },
        "salt": {
            type: "string"
        },
        "is_sysop": {
            type: "boolean",
            optional: true
        },
        "pending_email_change": {
            type: "object",
            properties: {
                "email": {
                    type: "string",
                    pattern: "^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$"
                },
                "token": {
                    type: "string",
                    maxLength: 40
                }
            },
            optional: true
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "permissions": {
            type: "array",
            optional: true
        },
        "timezone": {
            type: "string",
            optional: true
        },
        "date_format": {
            "enum": ["Y-m-d", "d-m-Y", "m-d-Y", "j F Y", "F j, Y"],
            optional: true
        },
        "time_format": {
            "enum": ["H:i", "g:i A", "H:i T", "g:i A T"],
            optional: true
        },
        "datetime_format": {
            "enum": ["Y-m-d H:i", "Y-m-d g:i A", "Y-m-d H:i T", "Y-m-d g:i A T",
                        "d-m-Y H:i", "d-m-Y g:i A", "d-m-Y H:i T", "d-m-Y g:i A T",
                        "m-d-Y H:i", "m-d-Y g:i A", "m-d-Y H:i T", "m-d-Y g:i A T",
                        "j F Y H:i", "j F Y g:i A", "j F Y H:i T", "j F Y g:i A T",
                        "F j, Y H:i", "F j, Y g:i A", "F j, Y H:i T", "F j, Y g:i A T"],
            optional: true
        },
        "gravatar_url": {
            type: "string",
            optional: true
        }
    } 
};
