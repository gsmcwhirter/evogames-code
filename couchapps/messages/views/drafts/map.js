function (doc){
    if (doc.type == "message" && !doc.status.sent){
        emit([doc.from.toLowerCase(), 0, doc.status.date], 1);
    }
}