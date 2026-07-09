const CACHE_NAME = "hdmi-view-v1";

const FILES = [

    "./",
    "./index.html",

    "./css/main.css",

    "./js/app.js",
    "./js/capture.js",

    "./manifest.json"

];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(CACHE_NAME)
            .then(
                cache =>
                cache.addAll(FILES)
            )

        );

    }
);



self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )
            .then(
                response =>
                response ||
                fetch(event.request)
            )

        );

    }
);
