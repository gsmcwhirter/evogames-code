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
            minLength: 5,
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