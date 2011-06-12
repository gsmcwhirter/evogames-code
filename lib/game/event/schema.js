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
        "name_or_handle": {
            type: "string",
            minLength: 1
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
        "gamecode": {
            type: "string",
            minLength: 1
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
        "gametype": require("../schema").gametype,
        "ranking_order": {
            type: "string",
            optional: true
        },
        "event_type": {
            "enum": ["group_register", "player_register"]
        },
        "register_type": {
            "enum": ["open", "request", "invite"]
        },
        "allow_same_group_opponents": {
            type: "boolean",
            optional: true
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
        },
        "disputes_closed": {
            type: "boolean",
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
        "rating": {
            type: "number"
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
        "wins": {
            type: "integer",
            minimum: 0
        },
        "losses": {
            type: "integer",
            minimum: 0
        },
        "ties": {
            type: "integer",
            minimum: 0
        },
        "players": {
            type: "array",
            minItems: 1,
            items: matchplayer
        }
    }
};

var dispute = module.exports.dispute = {
    type: "object",
    properties: {
        id: {
            type: "string",
            minLength: 1
        },
        created_by: {
            type: "string",
            minLength: 1
        },
        created_at: {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        creation_note: {
            type: "string",
            minLength: 1
        },
        resolved_by: {
            type: "string",
            minLength: 1,
            optional: true
        },
        resolved_at: {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z",
            optional: true
        },
        resolution_note: {
            type: "string",
            minLengh: 1,
            optional: true
        }
    }
};

module.exports.match = {
    type: "object",
    properties: {
        "type": {
            "enum": ["event-match"],
            "default": "event-match"
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
        "eventid": {
            type: "string",
            minLength: 1
        },
        "submitted_by": {
            type: "string",
            minLength: 1
        },
        "gametype_name": {
            type: "string",
            minLength: 1
        },
        "teams": {
            type: "array",
            minItems: 1,
            items: matchteam
        },
        "uses_groups": {
            type: "boolean"
        },
        "pending_disputes": {
            type: "array",
            items: dispute,
            optional: true
        },
        "resolved_disputes": {
            type: "array",
            items: dispute,
            optional: true
        }
    }
}