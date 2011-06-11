function(doc) {
    if (doc.type == "help-question" && doc.status.answered && doc.tags && doc.tags.length)
    {
        doc.tags.forEach(function (tag){
            emit([tag, 0, doc.question.toLowerCase()], 1);
        });
    }
}
