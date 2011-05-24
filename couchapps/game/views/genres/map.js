function (doc){
    if (doc.type == "game" && doc.genres && doc.genres.length){
        doc.genres.forEach(function (genre){
            emit([genre.toLowerCase(), doc.name.toLowerCase()], {genre: genre, name: doc.name, code: doc.code});
        });
    }
}