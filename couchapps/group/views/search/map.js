function (doc){
    function makeKey(letter_array, only_alphanum){
        var new_array = [];
        
        for (var i = 0; i < letter_array.length; i++){
            new_array[2 * i] = letter_array[i].toLowerCase();
            new_array[2 * i + 1] = 0;
        }

        new_array.pop();

        return new_array;
    }

    if (doc.type == "group"){
        var nkey1, ckey1;
        var nkey2, ckey2;
        var split;

        split = doc.name.split('');

        nkey1 = makeKey(split);
        nkey2 = makeKey(split).reverse();
        emit(nkey1, {source: "name", order: "asc", name: doc.name, code: doc.code});
        emit(nkey2, {source: "name", order: "desc", name: doc.name, code: doc.code});

        split = doc.code.split('');

        ckey1 = makeKey(split);
        ckey2 = makeKey(split).reverse();
        emit(ckey1, {source: "code", order: "asc", name: doc.name, code: doc.code});
        emit(ckey2, {source: "code", order: "desc", name: doc.name, code: doc.code});
    }
}