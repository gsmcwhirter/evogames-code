$(function (){
    var speed = 200;

    $(".qdata").hide();

    $("a.clickable.qname").toggle(
        function (){
            var q = $(this).parents(".question:first");
            q.find(".qdata").slideDown(speed);
        },
        function (){
            var q = $(this).parents(".question:first");
            q.find(".qdata").slideUp(speed);
        }
    );
});