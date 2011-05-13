function (newDoc, oldDoc, cdbuser)
{
    // !code ../validate_helpers.js

    if (newDoc.type == "player"){
        require(unchanged("created_at", newDoc, oldDoc), 'You may not change the creation timestamp.');
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
        require(unchanged("handle", newDoc, oldDoc), 'You must not change the handle.');

        require((!newDoc.pending_email_change ||
                    equals(newDoc.pending_email_change, {}) ||
                    newDoc.pending_email_change.email.match(email_regex)),
                    'Pending e-mail is not valid.');
        require(!newDoc.email_history.length || newDoc.email_history[newDoc.email_history.length - 1].email.match(email_regex),
                    'The e-mail address is not valid.');

        require(preserve_history("email_history", newDoc, oldDoc), 'You must preserve email history.');
    }

    if (newDoc.type == "login_token"){
        require(unchanged("created_at", newDoc, oldDoc), 'You may not change the creation timestamp.');
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
    }
}
