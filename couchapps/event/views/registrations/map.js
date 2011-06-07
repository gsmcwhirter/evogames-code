function (doc){
    if (doc.type == "event"){
        if (doc.registrations && doc.registrations.length){
            doc.registrations.forEach(function (registration){
                //by person
                emit([0, registration.id, 0, registration.approved ? 1 : 0, doc.name.toLowerCase()], {registration: registration, event: doc, _id: registration.id});
                //by event to get the associated docs
                emit([1, doc._id, 0, registration.approved ? 1 : 0, registration.name_or_alias.toLowerCase(), registration.code_or_handle.toLowerCase()], {registration: registration, event: doc, _id: registration.id});
            });
        }
    }
}