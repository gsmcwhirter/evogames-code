function (doc){
    if (doc.type == 'group' && doc.members && doc.members.length){
        doc.members.forEach(function (member){
            emit([member.id, 0, member.alias.toLowerCase(), doc.name], member);
        });
    }
}