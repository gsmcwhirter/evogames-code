function(doc) {
    if (doc.type == 'player')
    {
        if (doc.email_history.length > 0)
        {
            emit(doc.email_history[doc.email_history.length - 1].email.toLowerCase(), 1);
        }
        
        if (doc.pending_email_change && doc.pending_email_change.email)
        {
            emit(doc.pending_email_change.email.toLowerCase(), 1);
        }
    }  
}
