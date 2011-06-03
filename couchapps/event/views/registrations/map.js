function (doc){
    if (doc.type == "event"){
        if (doc.registrations && doc.registrations.length){
            doc.registrations.forEach(function (registration){
                if (registration.approved){
                    emit([registration.code_or_handle.toLowerCase(), 0, registration.name_or_alias.toLowerCase(), doc.name.toLowerCase()], registration);
                }
            });
        }
    }
}