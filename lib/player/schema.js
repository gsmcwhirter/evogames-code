module.exports.player = {
    type: "object",
    properties: {
        "type": {
            "enum": ["player"],
            "default": "player"
        },
        "handle": {
            type: "string",
            minLength: 3
        },
        "aliases": {
            type: "array",
            minItems: 1,
            items: {
                type: "string",
                minLength: 3
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
            maxLength: 40,
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
        }
    } 
};

module.exports.login_token = {
    type: "object",
    properties: {
        "type": {
            "enum": ["login_token"],
            "default": "login_token" 
        },
        "token": {
            type: "string",
            minLength: 32,
            maxLength: 40
        },
        "player": {
            type: "string",
            minLength: 32,
            maxLength: 40
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        }
    }
};
