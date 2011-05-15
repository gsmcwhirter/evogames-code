function (doc){
    if (doc.type == "group"){
        doc.owners.forEach(function (owner){
            emit(doc.code, {_id: owner});
        });
    }
}