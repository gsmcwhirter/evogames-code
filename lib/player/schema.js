var security_questions = [];

module.exports.security_questions = security_questions;

module.exports.player = {
    type: "object",
    properties: {
        "type": {
            "enum": ["player"],
            "default": "player"
        },
        "_id": {
            type: "string",
            minLength: 3 
        },
        "username": {
            type: "string",
            minLength: 3
        },
        "name_history": {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    "name": {
                        type: "string",
                        minLength: 3
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
        "status": {
            "enum": ["sysop","active","pending"],
            "default": "pending"
        },
        "lost_password_token": {
            type: "string",
            maxLength: 40,
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
        "security_questions": {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: {
                type: "object",
                properties: {
                    "question": {
                        "enum": security_questions
                    },
                    "answer": {
                        type: "string",
                        minLength: 4,
                        maxLength: 40
                    }
                }
            }
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
        "username": {
            type: "string",
            minLength: 3,
            maxLength: 32,
            fallbacks: {maxLength: 'truncateToMaxLength'}
        },
        "last_activity": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        }
    }
};
