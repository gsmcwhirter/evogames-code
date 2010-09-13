function(doc) {
    if (doc.type == "player")
    {
        if (doc.pending_email_change && doc.pending_email_change.email)
        {
            emit([doc.pending_email_change.email, doc.pending_email_change.token], null);
        }
    }
}
