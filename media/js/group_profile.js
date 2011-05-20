$(function (){
    var profile = $.sammy("#group-profile", function (){
        var speed = 200;

        this.get('', function (){
            $("#members").slideUp(speed);
            $(".member-toggle .verb").text("show");
            $(".member-toggle").attr("href","#!/members");
        });

        this.get("#!/", function (){
            $("#members").slideUp(speed);
            $(".member-toggle .verb").text("show");
            $(".member-toggle").attr("href","#!/members");
        });

        this.get("#!/members", function (){
            $("#members").slideDown(speed);
            $(".member-toggle .verb").text("hide");
            $(".member-toggle").attr("href","#!/");
        });
    });

    profile.run();
});