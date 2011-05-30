function (doc){
    if (doc.type == "game"){
        emit(doc.code.toLowerCase(), {code: doc.code, name: doc.name});
    }
}