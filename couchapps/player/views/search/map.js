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
        var hkeylen, akeylen;
        var i, j;
        var split;

        split = doc.handle.split('');
        hkey1 = makeKey(split);
        hkeylen = hkey1.length;

        (doc.aliases || []).forEach(function (alias){
            for (i = 0; i < hkeylen; i++){ //staring index
                for (j = 3; j <= hkeylen - i; j++){ //length, min 3
                    emit(hkey1.slice(2*i, 2*(i+j) - 1), {source: "handle", order: "asc", handle: doc.handle, alias: alias});
                }
            }
            
            split = alias.split('');
            akey1 = makeKey(split);
            akeylen = akey1.length;
            for (i = 0; i < akeylen; i++){ //starting index
                for (j = 3; j < akeylen - i; j++){ //length, min 3
                    emit(akey1.slice(2*i, 2*(i+j) - 1), {source: "alias", order: "asc", handle: doc.handle, alias: alias});
                }
            }
        });
    }
}