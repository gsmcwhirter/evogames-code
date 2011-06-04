$(function (){
    var profile = $.sammy("#event-profile", function (){
        var speed = 200;

        this.get('', function (){
            $("#registrations").slideUp(speed);
            $(".registration-toggle .verb").text("show");
            $(".registration-toggle").attr("href","#!/registrations");
        });

        this.get("#!/", function (){
            $("#registrations").slideUp(speed);
            $(".registration-toggle .verb").text("show");
            $(".registration-toggle").attr("href","#!/registrations");
        });

        this.get("#!/registrations", function (){
            $("#registrations").slideDown(speed);
            $(".registration-toggle .verb").text("hide");
            $(".registration-toggle").attr("href","#!/");
        });
    });

    profile.run();
});