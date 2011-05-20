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

    if (doc.type == "player"){
        var key1;
        var key2;

        key1 = makeKey(doc.handle.split(''));
        key2 = makeKey(doc.handle.split('')).reverse();
        emit(key1, {source: "handle", order: "asc"});
        emit(key2, {source: "handle", order: "desc"});

        (doc.aliases || []).forEach(function (alias){
            key1 = makeKey(alias.split(''));
            key2 = makeKey(alias.split('')).reverse();
            emit(key1, {source: "alias", order: "asc"});
            emit(key2, {source: "alias", order: "desc"});
        });
    }
}