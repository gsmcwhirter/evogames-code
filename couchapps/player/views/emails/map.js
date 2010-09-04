function(doc) {
    if (doc.type == 'player')
    {
        emit([doc.email_history[doc.email_history.length - 1].email.toLowerCase(),
                doc.email_history[doc.email_history.length - 1].email], 1);
    }  
}
