function (doc){
    if (doc.type == "event"){
        emit([doc.enddate, 0, doc.startdate], 1);
    }
}