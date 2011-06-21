function (doc, req){
    if (doc.type == "message" && doc.status && doc.status.sent){
        return true;
    }

    return false;
}