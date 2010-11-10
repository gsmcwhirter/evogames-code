//todo - generate these lists
var statuses = module.exports.statuses = {
    "new": ["new"], 
    "open": ["triaged","in progress","on hold"], 
    "closed": ["complete","invalid"]
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
            "default": "ticket"
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
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "owner": {
            type: "string",
            minLength: 32,
            maxLength: 40
        },
        "assigned_to": {
            type: "array",
            items: {
                type: "string",
                minLength: 32,
                maxLength: 40
            }
        },
        "sorting": {
            type: "number",
            "default": 0,
            optional: true
        },
        "ticket_type": {
            "enum": ["bug report","feature request","other"]
        },
        "milestone": {
            type: "string",
            minLength: 1,
            maxLength: 40,
            optional: true
        },
        "status": {
            type: "object",
            properties: {
                "category": {
                    "enum": Object.keys(statuses)
                },
                "status": {
                    "enum": status_list        
                }
            }
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
            "default": "ticket_comment"
        },
        "ticket_id": {
            type: "string",
            minLength: 32,
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
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "owner": {
            type: "string",
            minLength: 32,
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

module.exports.watcher = {
    type: "object",
    properties: {
        "type": {
            "enum": ["watcher"],
            "default": "watcher"
        },
        "ticket": {
            type: "string",
            minLength: 32,
            maxLength: 40
        },
        "watcher": {
            type: "string",
            minLength: 32,
            maxLength: 40
        },
        "notifications": {
            type: "object",
            properties: {
                "email": {
                    type: "boolean",
                    "default": false
                },
                "pm": {
                    type: "boolean",
                    "default": false
                }
            }        
        }
    }
}
