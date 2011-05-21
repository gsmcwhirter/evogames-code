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
        var hkey1, akey1;
        var hkey2, akey2;

        var split;

        split = doc.handle.split('');
        hkey1 = makeKey(split);
        hkey2 = makeKey(split).reverse();

        (doc.aliases || []).forEach(function (alias){
            emit(hkey1, {source: "handle", order: "asc", handle: doc.handle, alias: alias});
            emit(hkey2, {source: "handle", order: "desc", handle: doc.handle, alias: alias});

            split = alias.split('');
            akey1 = makeKey(split);
            akey2 = makeKey(split).reverse();
            emit(akey1, {source: "alias", order: "asc", handle: doc.handle, alias: alias});
            emit(akey2, {source: "alias", order: "desc", handle: doc.handle, alias: alias});
        });
    }
}