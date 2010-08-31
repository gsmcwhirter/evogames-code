var Schema = require('schema');

module.exports.player = new Schema({
    type: "object",
    properties: {
        "type": {
            enum: ["player"]
            default: "player"
        },
        "_id": {
            type: "string",
            minLength: 3,
            maxLength: 32,
            fallbacks: {maxLength: 'truncateToMaxLength'} 
        },
        "username": {
            type: "string",
            minLength: 3,
            maxLength: 32,
            fallbacks: {maxLength: 'truncateToMaxLength'}
        },
        "name_history": {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    "name": {
                        type: "string",
                        minLength: 3,
                        maxLength: 32,
                        fallbacks: {maxLength: 'truncateToMaxLength'}
                    },
                    "date": {
                        type: "string",
                        minLength: "0000-00-00T00:00:00Z".length,
                        maxLength: "0000-00-00T00:00:00Z".length
                    }
                },
                additionalProperties: false
            }
        },
        "email_history": {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    "email": {
                        type: "string",
                        minLength: 4
                    },
                    "date": {
                        type: "string",
                        minLength: "0000-00-00T00:00:00Z".length,
                        maxLength: "0000-00-00T00:00:00Z".length
                    }
                },
                additionalProperties: false
            }
        },
        "password": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "salt": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "lost_password_token": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "pending_email_change": {
            type: "object",
            properties: {
                "email": {
                    type: "string",
                    minLength: 4
                },
                "token": {
                    type: "string",
                    minLength: 40,
                    maxLength: 40
                }
            },
            additionalProperties: false
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00Z".length,
            maxLength: "0000-00-00T00:00:00Z".length
        }
    } 
});

module.exports.login_token = new Schema({
    type: "object",
    properties: {
        "type": {
            enum: ["login_token"],
            default: "login_token" 
        },
        "username": {
            type: "string",
            minLength: 3,
            maxLength: 32,
            fallbacks: {maxLength: 'truncateToMaxLength'}
        },
        "last_activity": {
            type: "string",
            minLength: "0000-00-00T00:00:00Z".length,
            maxLength: "0000-00-00T00:00:00Z".length
        }
    }
});
