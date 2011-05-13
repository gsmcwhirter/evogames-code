var email_regex = new RegExp('^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$');

function unchanged(field, newer, older){
    if (!newer._deleted && older && toJSON(older[field]) != toJSON(newer[field])){
        return false;
    }

    return true;
}

function require(test, msg){
    if (!test) throw({forbidden: msg});
}

function keys(a){
    var ret = [];
    if (typeof(a) == 'object')
    {
        for (var idx in a)
        {
            ret.push(idx);
        }
    }
    
    return ret;
}

function equals(a, b){
    if(typeof(a) == 'object' && typeof(b) == 'object')
    {
        if (keys(a).length != keys(b).length)
        {
            return false;
        }
        
        for (var idx in a)
        {
            if (!equals(a[idx], b[idx]))
            {
                return false;
            }
        }
        
        return true;
    }
    else
    {
        return a == b;
    }
}
    
function preserve_history(field, newer, older)
{
    if (newer._deleted || !older){
        return true;
    }

    for (var idx in older[field])
    {
        if (!equals(newer[field][idx], older[field][idx]))
        {
            return false;
        }
    }
    
    return true;
}

