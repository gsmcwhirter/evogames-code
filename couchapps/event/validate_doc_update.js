function (newDoc, oldDoc, cdbuser){
    // !code ../validate_helpers.js

    if (newDoc.type == "event"){
        require(unchanged("created_at", newDoc, oldDoc), 'You may not change the creation timestamp.');
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
        require(unchanged("event_type", newDoc, oldDoc), 'You may not change the event type.');

        if (newDoc.startdate && newDoc.enddate){
            require(newDoc.startdate <= newDoc.enddate, 'Start date must be before end date.');
        }
    }

}
