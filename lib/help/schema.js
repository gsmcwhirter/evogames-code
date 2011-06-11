module.exports.question = {
    type: "object",
    properties: {
        "type": {
            "enum": ["help-question"],
            "default": "help-question"
        },
        question: {
            type: "string",
            minLength: 1
        },
        slug: {
            type: "string",
            minLength: 1,
            maxLength: 50,
            pattern: {pattern: "^[a-z0-9\\-_]*$", message: "must contain only letters, numbers, hyphens, and underscores."},
            optional: true
        },
        answer: {
            type: "string",
            minLength: 1,
            optional: true
        },
        status: {
            type: "object",
            properties: {
                answered: {
                    type: "boolean"
                },
                date: {
                    type: "string",
                    minLength: "0000-00-00T00:00:00.000Z".length,
                    maxLength: "0000-00-00T00:00:00.000Z".length,
                    pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
                }
            }
        },
        tags: {
            type: "array",
            minItems: 0,
            items: {
                type: "string",
                minLength: 1,
                pattern: {pattern: "^[a-zA-Z0-9\\-_.:/ ]*$", message: "contains invalid characters."}
            },
            optional: true
        },
        edits: {
            type: "array",
            optional: true,
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        minLength: 1
                    },
                    date: {
                        type: "string",
                        minLength: "0000-00-00T00:00:00.000Z".length,
                        maxLength: "0000-00-00T00:00:00.000Z".length,
                        pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
                    }
                }
            }
        }
    }
};
