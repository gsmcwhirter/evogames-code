function (doc){
    if (doc.type == "game"){
        emit(doc.name.toLowerCase(), {name: doc.name, code: doc.code});
    }
}