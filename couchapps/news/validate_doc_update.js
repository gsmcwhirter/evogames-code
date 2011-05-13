function (newDoc, oldDoc, cdbuser){
    // !code ../validate_helpers.js

    if (newDoc.type == "article"){
        require(unchanged("type", newDoc, oldDoc), 'You may not change the document type.');
    }

}
