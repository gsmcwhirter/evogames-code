function (keys, vals, rereduce){
    if (rereduce)
    {
        return sum(vals);
    }
    
    var ct = 0;
    vals.forEach(function (val){
        ct += val.count || 0;
    });
    
    return ct;
}
