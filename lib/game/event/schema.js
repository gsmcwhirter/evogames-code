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
            maxLength: 50,
            pattern: {pattern: "^[a-z0-9\\-_]*$", message: "must contain only letters, numbers, hyphens, and underscores."}
        },
        "gameid": {
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
            items: {
                type: "string",
                minLength: 1
            }
        },
        "minTeams": {
            type: "integer",
            minimum: 1
        },
        "gametype_name": {
            type: "string"
        },
        "gametype": require("../schema").gametype,
        "event_type": {
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

var matchplayer = module.exports.matchplayer = {
    type: "object",
    properties: {
        "groupcode": {
            type: "string",
            minLength: 1,
            optional: true
        },
        "handle": {
            type: "string",
            minLength: 1
        },
        "alias": {
            type: "string",
            minLength: 1
        },
        "stats": {
            type: "object"
        },
        "rank": {
            type: "integer",
            minimum: 1
        }
    }
};

var matchteam = module.exports.matchteam = {
    type: "object",
    properties: {
        "rank": {
            type: "integer",
            minimum: 1
        },
        "players": {
            type: "array",
            minItems: 1,
            items: matchplayer
        }
    }
};

module.exports.match = {
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
        "gameid": {
            type: "string",
            minLength: 3
        },
        "teams": {
            type: "array",
            minItems: 1,
            items: matchteam
        },
        "uses_groups": {
            type: "boolean"
        }
        
    }
}