$(function (){
        
    function reconfigure(){
        $("#past-events li").show();
        $("#past-events .group-directory").show();
    }

    function do_search(){
        var string = $(this).val().toLowerCase();
        if (string === '') {
            reconfigure();
        } else {
            $("#past-events li").hide();
            $("#past-events li").each(function (index) {
                var element = $(this);
                if ($("a", element).text().toLowerCase().indexOf(string) >= 0) {
                    element.show();
                }
                else {
                    element.hide();
                }
            });
        }
    }

    reconfigure();
    $("#search").bind("keyup", do_search);
    $("#search").bind("change", do_search);
    $("#search").bind("click", do_search);

});