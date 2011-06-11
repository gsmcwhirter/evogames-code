function(doc) {
    if (doc.type == "help-question" && !doc.status.answered)
    {
        emit(doc.status.date, 1);
    }
}
