function(doc) {
    if (doc.type == 'login_token')
    {
        emit(doc._id, {_id: doc.username, last_activity: doc.last_activity});
    }
}
