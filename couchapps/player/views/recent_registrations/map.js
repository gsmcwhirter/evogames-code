function (doc){
    if (doc.type == "player" && doc.email_history && doc.email_history.length)
    {
        emit(doc.created_at, 1);
    }
}
