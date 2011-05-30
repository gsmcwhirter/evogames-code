function (doc){
    var letters = [ 'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    if (doc.type == "group"){
        if (letters.indexOf(doc.name[0].toLowerCase()) > -1){
            emit([0, doc.name.toLowerCase()], 1);
        }
        else {
            emit([1, doc.name.toLowerCase()], 1);
        }
    }
}