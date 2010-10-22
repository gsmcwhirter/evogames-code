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
            type: "string"
        },
        "date": {
        
        },
        "owner": {
        
        },
        "assigned_to": {
        
        },
        "ticket_type": {
        
        },
        "sort": {
        
        },
        "tags": {
        
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
        
        },
        "subject": {
        
        },
        "body": {
        
        },
        "date": {
        
        },
        "owner": {
        
        },
        "actions": {
        
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
            
        },
        "player_id": {
        
        },
        "notifications": {
        
        }
    }
}
