var admin = module.exports.admin = {
    type: "object",
    properties: {
        "handle": {
            type: "string",
            minLength: 1
        },
        "privileges": {
            type: "array",
            items: {
                type: "string",
                minLength: 1
            }
        }
    }
}

var registration = module.exports.registration = {
    type: "object",
    properties: {
        "type": {
            "enum": ["group", "player"]
        },
        "id": {
            type: "string",
            minLength: 1
        },
        "code_or_handle": {
            type: "string",
            minLength: 1
        },
        "name_or_alias": {
            type: "string",
            minLength: 1
        },
        "approved": {
            type: "boolean"
        }
    }
}

var invitation = module.exports.invitation = {
    type: "object",
    properties: {
        "type": {
            "enum": ["group","player"]
        },
        "id": {
            type: "string",
            minLength: 1
        }
    }
}

module.exports.event = {
    type: "object",
    properties: {
        "type": {
            "enum": ["event"],
            "default": "event"
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "name": {
            type: "string",
            minLength: 3
        },
        "slug": {
            type: "string",
            minLength: 3,
            pattern: {pattern: "^[a-z0-9\\-]*$", message: "must contain only letters, numbers, and hyphens."}
        },
        "gamecode": {
            type: "string",
            minLength: 3
        },
        "description": {
            type: "string",
            optional: true
        },
        "rules": {
            type: "string",
            optional: true
        },
        "creator": {
            type: "string",
            minLength: "1"
        },
        "admins": {
            type: "array",
            optional: true,
            items: admin
        },
        "maxTeams": {
            type: "integer"
        },
        "gametype_name": {
            type: "string"
        },
        "gametype": require("../schema").gametype,
        "eventtype": {
            "enum": ["group_register", "player_register"]
        },
        "register_type": {
            "enum": ["public", "request", "invite"]
        },
        "registrations": {
            type: "array",
            optional: true,
            items: registration
        },
        "invitations": {
            type: "array",
            optional: true,
            items: invitation
        },
        "startdate": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z",
            optional: true
        },
        "enddate": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z",
            optional: true
        }
    }
}