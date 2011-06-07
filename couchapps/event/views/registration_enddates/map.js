function (doc){
    if (doc.type == "event"){
        if (doc.registrations && doc.registrations.length){
            doc.registrations.forEach(function (registration){
                //by person or group
                emit([registration.id, 0, doc.enddate ? doc.enddate : "N", 0, doc.startdate, doc.name.toLowerCase()], {registration: registration, event: doc, _id: doc.gameid});
            });
        }
    }
}