function (newDoc, oldDoc, cdbuser){
    // !code ../validate_helpers.js

    if (newDoc.type == "help-question"){
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
    }

}
