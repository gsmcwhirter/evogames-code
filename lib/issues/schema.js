var statuses = module.exports.statuses = {
    "new": [], 
    "open": [], 
    "closed": []
};

var status_list = [];
for (var typ in statuses){
    statuses[typ].forEach(function (status){
        status_list.push(status);
    });    
}

module.exports.ticket = {
    type: "object",
    properties: {
        "type": {
            "enum": ["ticket"],
            default: "ticket"
        },
        "subject": {
            type: "string",
            minLength: 1,
            maxLength: 255
        },
        "body": {
            type: "string",
            minLength: 1
        },
        "date": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "owner": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "assigned_to": {
            type: "array",
            items: {
                type: "string",
                minLength: 40,
                maxLength: 40
            }
        },
        "sorting": {
            type: "number",
            default: 0
        },
        "ticket_type": {
            "enum": ["bug report","feature request","other"]
        },
        "milestone": {
            type: "string",
            minLength: 40,
            maxLength: 40,
            optional: true
        },
        "status": {
            "enum": status_list
        },
        "tags": {
            type: "array",
            items: {
                type: "string",
                minLength: 1,
                maxLength: 40
            }
        }
    }
}

module.exports.comment = {
    type: "object",
    properties: {
        "type": {
            "enum": ["ticket_comment"],
            default: "ticket_comment"
        },
        "ticket_id": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "subject": {
            type: "string",
            minLength: 1,
            maxLength: 255
        },
        "body": {
            type: "string",
            minLength: 1
        },
        "date": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "owner": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "actions": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "action": {
                        type: "string"
                    },
                    "data": {
                        type: "string"
                    }
                }
            }
        }
    }
}

module.exports.milestone = {
    type: "object",
    properties: {
        "type": {
            "enum": ["milestone"],
            default: "milestone"
        },
        "name": {
            type: "string",
            minLength: 1
        },
        "sort": {
            type: "number",
            default: 0
        }
    }
}

module.exports.watcher = {
    type: "object",
    properties: {
        "type": {
            "enum": ["ticket"],
            default: "ticket"
        },
        "ticket_id": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "player_id": {
            type: "string",
            minLength: 40,
            maxLength: 40
        },
        "notifications": {
            type: "object",
            properties: {
                "email": {
                    type: "boolean",
                    default: false                
                },
                "pm": {
                    type: "boolean",
                    default: false
                }
            }        
        }
    }
}
