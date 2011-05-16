module.exports.group = {
    type: "object",
    properties: {
        "type": {
            "enum": ["group"],
            "default": "group"
        },
        "created_at": {
            type: "string",
            minLength: "0000-00-00T00:00:00.000Z".length,
            maxLength: "0000-00-00T00:00:00.000Z".length,
            pattern: "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z"
        },
        "name": {
            type: "string",
            minLength: 1
        },
        "code": {
            type: "string",
            minLength: 1,
            pattern: {pattern: "^[a-zA-Z0-9\\-_\\[\\]]*$", message: "contains invalid characters"}
        },
        "description": {
            type: "string",
            optional: true
        },
        "owners": {
            type: "array",
            minItems: 1,
            items: {
                type: "string",
                minLength: 1
            }
        },
        "website": {
            type: "string",
            optional: true,
            //The follow regex is from http://daringfireball.net/2010/07/improved_regex_for_matching_urls
            pattern: new RegExp("(?:^$)|(?:^(?:https?://|www\\d{0,3}[.]|[a-z0-9.\\-]+[.][a-z]{2,4}/)(?:[^\\s()<>]+|\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\))+(?:\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[\\]{};:'\".,<>?]))$", "i")
        },
        "join_type": {
            type: {
                "enum": ["invite","approval","open"],
                "default": "approval"
            }
        }
    }
}
