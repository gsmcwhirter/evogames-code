var Schema = require('schema');

module.exports.menu = new Schema({
    type: "object",
    properties: {
        "type": {
            enum: ["menu"],
            default: "menu"
        }
        "title": {
            type: "string",
            minLength: 1,
            maxLength: 30
        },
        "order": {
            type: "float",
            minimum: 0.0,
            maximum: 1.0,
            inMinMax: false
        },
        "group": {
            type: "string",
            default: "main",
            minLength: 1
        },
        "restrict_to": {
            type: "string",
            default: ""
        }
        "items": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "title": {
                        type: "string",
                        minLength: 1,
                        maxLength: 30
                    },
                    "href": {
                        type: "string",
                        minLength: 1,
                        default: "#"
                    },
                    "description": {
                        type: "string",
                        default: ""
                    },
                    "order": {
                        type: "float",
                        minimum: 0.0,
                        maximum: 1.0,
                        inMinMax: false
                    }
                    "restrict_to": {
                        type: "string",
                        default: ""
                    }
                }
            }
        }
    }
});
