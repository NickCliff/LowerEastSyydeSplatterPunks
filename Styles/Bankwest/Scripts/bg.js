
(function () {

    var $container;
    var $image;
    var imageDetails = {};
    var containerDetails = {};

    function init() {

        $("div.background").each(function () {
            $container = $(this);

            // get background image path
            var src = AppStore.App.themes.containerPath + '/Styles/' + AppStore.App.themes.containerTheme + '/Images/' + getRandomBg();
            //console.log(src);
            // create an image element
            $image = $('<img/>').attr('src', src).attr('alt', 'Background image').appendTo($container);

            $image.one('load', function () {
                imageDetails.width = $image.width();
                imageDetails.height = $image.height();
                imageDetails.aspectRatio = imageDetails.width / imageDetails.height;
                $image.data("details", imageDetails);
                updateImage();
            });
        });

        $(window).bind("resize", function () {
            updateImage();
        });
    }

    function updateImage() {
        containerDetails.width = $container.width();
        containerDetails.height = $container.height();
        imageDetails = $image.data("details");

        var newWidth;
        var newHeight;

        if (containerDetails.width > containerDetails.height) {
            newWidth = containerDetails.width;
            newHeight = containerDetails.width / imageDetails.aspectRatio;
        } else {
            newHeight = containerDetails.height;
            newWidth = containerDetails.height * imageDetails.aspectRatio;
        }

        if (containerDetails.height > newHeight) {
            newHeight = containerDetails.height;
            newWidth = containerDetails.height * imageDetails.aspectRatio;
            $image.css({ "position": "absolute", "top": 0 });
        } else {
            var offset = -1 * Math.round((newHeight - containerDetails.height) / 2);
            $image.css({ "position": "absolute", "top": offset });
        }
        $image.width(newWidth);
        $image.height(newHeight);
    }

    function getRandomBg() {
        switch (getRandomInt(1, 5)) {
            case 1: return 'bg.jpg';
            case 2: return 'bg_all_accounts.jpg';
            case 3: return 'bg_transfer_money.jpg';
            case 4: return 'bg_transactions.jpg';
            case 5: return 'bg_help.png';
            default: return 'bg.jpg';
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    init();

})();