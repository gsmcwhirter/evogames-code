function (doc){
    if (doc.type == "event"){
        emit([doc.startdate, 0, doc.enddate], 1);
    }
}