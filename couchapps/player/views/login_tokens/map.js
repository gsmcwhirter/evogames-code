function(doc) {
    if (doc.type == 'login_token')
    {
        emit(doc.token, {_id: doc.player, token: doc});
    }
}
