function (newDoc, oldDoc, cdbuser){
    // !code ../validate_helpers.js

    if (newDoc.type == "message"){
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
        require(unchanged("from", newDoc, oldDoc), 'You may not change the sender.');
    }

}
