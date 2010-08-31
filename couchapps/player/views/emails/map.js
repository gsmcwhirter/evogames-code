function(doc) {
    var email;
    if (doc.type == 'player')
    {
        email = doc.email_history[doc.email_history.length - 1].email;
        emit([email.toLowerCase(), email], 1);
    }  
}
