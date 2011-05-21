function (doc){
    if (doc.type == "group"){
        (doc.members || []).forEach(function (member){
            if (member.admin && member.admin.length){
                emit(member.id, member.admin);
            }
        });
    }
}