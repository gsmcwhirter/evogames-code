var sio = require("socket.io"),
    base = require("./lib/base"),
    config = require("./config.live"),
    API = require("./lib/api/internal");

module.exports = function (app){
    var couchdb = new base.couchdb(config.couchdb);
    var iapi = new API(couchdb);
    var since = -1;

    var sockethandles = {};

    var sys = require('util');

    var io = sio.listen(app);

    io.on('connection', function (socket){
        if (since == -1) since = 0;

        socket.on('message', function (data){
            var self = this;

            if (typeof data != "object"){
                data = {type: data};
            }

            if (data.type == "setid"){
                var id = data.id;
                iapi.getDoc(id, function (response){

                    if (response.type == "player"){
                        var handle = response.handle.toLowerCase();

                        self.pid = id;
                        self.phandle = handle;

                        if (!sockethandles[handle]) sockethandles[handle] = [];
                        sockethandles[handle].push(self);

                        self.send('setid-ok');
                    }
                });
            }

            else if (data.type == "getcount"){
                if (socket.phandle){
                    iapi.messages.newcount({startkey: [socket.phandle, 0], endkey: [socket.phandle, 1], reduce: false}, function (response){
                        if (response.rows && response.rows.length){
                            self.send({type: 'getcount', data: {count: response.rows.length, since: since, ids: response.rows.map(function (row){return row.id})}});
                        }
                        else {
                            self.send({type: 'getcount', data: {count: 0, since: since, ids: []}});
                        }
                    });
                }
            }
        });

        socket.on('disconnect', function (){
            if (!socket.phandle) return;

            var ind = sockethandles[socket.phandle].map(function (sock){return sock.id}).indexOf(socket.id);
            if (ind > -1) sockethandles[socket.phandle].splice(ind, 1);
        });
    });

    couchdb.changes("?feed=continuous&filter=messages/sent&include_docs=true&heartbeat=2000", function (change){
        //sys.log('change');
        //sys.log(sys.inspect(change));
        if (since > -1){
            if (change.last_seq) since = change.last_seq;
            if (change.seq > since) since = change.seq;

            if (!change.deleted && change.doc){
                var message = change.doc;
                var handles = [];
                handles = handles.concat((message.to || []).map(function (rec){return [rec.handle.toLowerCase(), rec.is_deleted || rec.is_read]}));
                handles = handles.concat((message.cc || []).map(function (rec){return [rec.handle.toLowerCase(), rec.is_deleted || rec.is_read]}));
                handles = handles.concat((message.bcc || []).map(function (rec){return [rec.handle.toLowerCase(), rec.is_deleted || rec.is_read]}));

                sys.log('pushing');
                //sys.log(sys.inspect(handles));

                handles.forEach(function (handle){
                    sys.log(handle[0]);
                    sys.log((sockethandles[handle[0]] || []).length);

                    (sockethandles[handle[0]] || []).forEach(function (sock){
                        sock.send({type: 'msgchange', data: {id: message._id, is_read: handle[1], since: change.seq}});
                    });
                });
            }
            else {
                sys.log(sys.inspect(change));
            }
        }
    });

}