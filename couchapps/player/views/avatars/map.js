function (doc){
    if (doc.type == "player" && doc.email_history && doc.email_history.length){
        emit(doc.handle.toLowerCase(), doc.email_history[doc.email_history.length - 1].email);
    }
}