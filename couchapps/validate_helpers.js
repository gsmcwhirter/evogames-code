

var email_regex = new RegExp('^([a-zA-Z0-9_\\-.]+)@(([a-zA-Z0-9\\-]+\\.)+)([a-zA-Z]{2,9})$');

function require(test, msg)
{
    if (!test) throw({forbidden: msg});
}

function keys(a)
{
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

function equals(a, b)
{
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
    
function preserve_history(newer, older)
{
    for (var idx in older)
    {
        if (!equals(newer[idx], older[idx]))
        {
            return false;
        }
    }
    
    return true;
}

