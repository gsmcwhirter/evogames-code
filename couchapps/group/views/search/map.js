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
        var nkeylen, ckeylen;
        var i, j;
        var split;

        split = doc.name.split('');

        nkey1 = makeKey(split);
        nkeylen = (nkey1.length + 1) / 2;
        for (i = 0; i < nkeylen; i++){ //starting index
            for (j = 3; j <= nkeylen - i; j++){ //length, min 3
                emit(nkey1.slice(2*i, 2*(i+j) - 1), {source: "name", order: "asc", name: doc.name, code: doc.code});
            }
        }
        

        split = doc.code.split('');

        ckey1 = makeKey(split);
        ckeylen = (ckey1.length + 1) / 2;
        for (i = 0; i < ckeylen; i++){ //starting index
            for (j = 3; j <= ckeylen - i; j++){ //length, min 3
                emit(ckey1.slice(2*i, 2*(i+j) - 1), {source: "code", order: "asc", name: doc.name, code: doc.code});
            }
        }
        
    }
}