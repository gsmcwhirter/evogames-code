function (newDoc, oldDoc, cdbuser)
{
    // !code ../validate_helpers.js
    
    if (newDoc.created_at || (oldDoc && oldDoc.created_at))
    {
        require((!oldDoc || oldDoc.created_at == newDoc.created_at),
                'You may not change the creation timestamp.');
    }

    if (newDoc.type == 'player')
    {
        require(!(oldDoc && oldDoc.type != newDoc.type),
                'You may not change the type.');
        require((newDoc._id == newDoc.username),
                'Username must match _id.');
        require((equals(newDoc.pending_email_change, {}) || 
                newDoc.pending_email_change.email.match(email_regex)),
                'Pending e-mail is not valid.');
        require(newDoc.email_history[newDoc.email_history.length - 1].email.match(email_regex),
                'The e-mail address is not valid.');
        require((!oldDoc || preserve_history(newDoc.email_history, oldDoc.email_history)),
                'You must preserve email history.');
        require((!oldDoc || preserve_history(newDoc.name_history, oldDoc.name_history)),
                'You must preserve name history.');    
    }
    
    if (newDoc.type == 'login_token')
    { }
}
