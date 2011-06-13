function (doc){
    if (doc.type == "message" && doc.status.sent){
        (doc.to || []).forEach(function (rec){
            if (!rec.is_deleted){
                emit([rec.handle.toLowerCase(), 0, doc.status.date], 1);
            }
        });

        (doc.cc || []).forEach(function (rec){
            if (!rec.is_deleted){
                emit([rec.handle.toLowerCase(), 0, doc.status.date], 1);
            }
        });

        (doc.bcc || []).forEach(function (rec){
            if (!rec.is_deleted){
                emit([rec.handle.toLowerCase(), 0, doc.status.date], 1);
            }
        });
    }
}