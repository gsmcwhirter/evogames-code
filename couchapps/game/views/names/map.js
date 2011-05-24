function (doc){
    if (doc.type == "game"){
        emit([doc.name.toLowerCase(), doc.name], {name: doc.name, code: doc.code});
    }
}