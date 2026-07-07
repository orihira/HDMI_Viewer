/* =====================================================
   HDMI View
   Application Controller

   Version 1.0.0

   Responsibilities:
   - App initialization
   - UI management
   - Status control
   - User interaction
===================================================== */


/* =========================
   Global State
========================= */

const HDMIView = {

    version: "1.0.0",

    connected: false,

    stream: null,

    uiTimer: null,

    settings: {}

};



/* =========================
   DOM Elements
========================= */

const DOM = {

    app:
        document.getElementById("app"),

    loading:
        document.getElementById("loading-screen"),

    statusText:
        document.getElementById("status-text"),

    statusDot:
        document.querySelector(".status-dot"),

    video:
        document.getElementById("video"),

    overlay:
        document.getElementById("overlay"),

    toast:
        document.getElementById("toast"),

    connectButton:
        document.getElementById("connectButton"),

    fitButton:
        document.getElementById("fitButton"),

    fullscreenButton:
        document.getElementById("fullscreenButton"),

    settingsButton:
        document.getElementById("settingsButton"),

    nav:
        document.querySelector("nav")

};



/* =========================
   App Start
========================= */

window.addEventListener(
    "load",
    init
);



function init(){

    console.log(
        `HDMI View v${HDMIView.version}`
    );


    loadSettings();


    setupEvents();


    finishLoading();


    showToast(
        "Ready"
    );

}



/* =========================
   Loading
========================= */


function finishLoading(){

    setTimeout(()=>{


        DOM.loading.style.opacity = "0";


        DOM.loading.style.visibility =
            "hidden";


    },800);

}



/* =========================
   Status Control
========================= */


function setStatus(
    connected,
    text
){


    HDMIView.connected =
        connected;


    DOM.statusText.textContent =
        text;



    if(connected){


        DOM.statusDot.classList.add(
            "status-connected"
        );


    }else{


        DOM.statusDot.classList.remove(
            "status-connected"
        );


    }

}



/* =========================
   Toast
========================= */


function showToast(message){


    DOM.toast.textContent =
        message;


    DOM.toast.classList.add(
        "show"
    );


    setTimeout(()=>{


        DOM.toast.classList.remove(
            "show"
        );


    },2500);


}



/* =========================
   Events
========================= */


function setupEvents(){


    /*
        Connect button

        Actual camera connection
        will be handled by capture.js
    */


    DOM.connectButton.addEventListener(
        "click",
        ()=>{


            showToast(
                "Connecting..."
            );


            if(
                window.startCapture
            ){

                window.startCapture();

            }


        }
    );



    /*
        Video Fit Toggle
    */


    let fitMode = true;


    DOM.fitButton.addEventListener(
        "click",
        ()=>{


            fitMode =
                !fitMode;



            DOM.video.style.objectFit =
                fitMode
                ?
                "contain"
                :
                "cover";



            showToast(
                fitMode
                ?
                "Fit"
                :
                "Fill"
            );


        }
    );



    /*
        Fullscreen
    */


    DOM.fullscreenButton.addEventListener(
        "click",
        toggleFullscreen
    );



    /*
        Settings
    */


    DOM.settingsButton.addEventListener(
        "click",
        ()=>{


            showToast(
                "Settings"
            );


        }
    );



    /*
        Hide UI timer
    */


    document.addEventListener(
        "mousemove",
        resetUITimer
    );


    document.addEventListener(
        "touchstart",
        resetUITimer
    );


}



/* =========================
   UI Auto Hide
========================= */


function resetUITimer(){


    document.body.classList.remove(
        "ui-hidden"
    );


    clearTimeout(
        HDMIView.uiTimer
    );


    HDMIView.uiTimer =
        setTimeout(()=>{


            document.body.classList.add(
                "ui-hidden"
            );


        },5000);


}



/* =========================
   Fullscreen
========================= */


async function toggleFullscreen(){


    try{


        if(!document.fullscreenElement){


            await DOM.app.requestFullscreen();



        }else{


            await document.exitFullscreen();



        }


    }catch(error){


        console.error(
            error
        );


    }


}



/* =========================
   Settings
========================= */


function loadSettings(){


    const saved =
        localStorage.getItem(
            "hdmi-view-settings"
        );


    if(saved){


        HDMIView.settings =
            JSON.parse(saved);


    }


}



function saveSettings(){


    localStorage.setItem(
        "hdmi-view-settings",
        JSON.stringify(
            HDMIView.settings
        )
    );


}



/* =========================
   Export
========================= */


window.HDMIView =
    HDMIView;


window.setStatus =
    setStatus;


window.showToast =
    showToast;