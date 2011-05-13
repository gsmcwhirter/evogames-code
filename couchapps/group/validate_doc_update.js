function (newDoc, oldDoc, cdbuser){
    // !code ../validate_helpers.js

    if (newDoc.type == "group"){
        require(unchanged("created_at", newDoc, oldDoc), 'You may not change the creation timestamp.');
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
    }

}
