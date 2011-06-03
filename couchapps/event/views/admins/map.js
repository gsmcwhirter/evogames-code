function (doc){
    if (doc.type == "event"){
        if (doc.admins && doc.admins.length){
            doc.admins.forEach(function (admin){
                emit([admin.handle.toLowerCase(), 0, doc.name.toLowerCase()], admin);
            });
        }
    }
}