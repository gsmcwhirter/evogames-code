function (doc){
    function makeKey(letter_array){
        var new_array = [];
        
        for (var i = 0; i < letter_array.length; i++){
            new_array[2 * i] = letter_array[i].toLowerCase();
            new_array[2 * i + 1] = 0;
        }

        new_array.pop();

        return new_array;
    }

    if (doc.type == "group"){
        var key1;
        var key2

        key1 = makeKey(doc.name.split(''));
        key2 = makeKey(doc.name.split('')).reverse();
        emit(key1, {source: "name", order: "asc"});
        emit(key2, {source: "name", order: "desc"});

        key1 = makeKey(doc.code.split(''));
        key2 = makeKey(doc.code.split('')).reverse();
        emit(key1, {source: "code", order: "asc"});
        emit(key2, {source: "code", order: "desc"});
    }
}