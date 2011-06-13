var recipient = module.exports.recipient = {
    type: "object",
    properties: {
        handle: {
            type: "string",
            minLength: 1
        },
        is_read: {
            type: "boolean"
        },
        is_deleted: {
            type: "boolean"
        }
    }
};

module.exports.message = {
    type: "object",
    properties: {
        type: {
            "enum": ["message"],
            "default": "message"
        },
        from: {
            type: "string"
        },
        to: {
            type: "array",
            items: recipient
        },
        cc: {
            type: "array",
            items: recipient
        },
        bcc: {
            type: "array",
            items: recipient
        },
        subject: {
            type: "string",
            minLength: 1
        },
        body: {
            type: "string",
            minLength: 1
        }
    }
}