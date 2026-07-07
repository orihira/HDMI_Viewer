/* =====================================================
   HDMI View
   Capture Controller

   Version 1.0.0

   Responsibilities:
   - Detect UVC devices
   - Connect camera stream
   - Attach stream to video
   - Handle errors
===================================================== */


const Capture = {


    stream: null,


    deviceId: null,


    connected: false,


    devices: []


};



/* =========================
   Device Detection
========================= */


async function getDevices(){


    try{


        const devices =
            await navigator.mediaDevices
                .enumerateDevices();



        Capture.devices =
            devices.filter(
                device =>
                    device.kind === "videoinput"
            );



        console.log(
            "Video devices:",
            Capture.devices
        );



        return Capture.devices;



    }catch(error){


        console.error(
            error
        );


        showToast(
            "Camera detection failed"
        );


        return [];

    }


}



/* =========================
   Find Capture Device
========================= */


function findCaptureDevice(){


    const keywords = [

        "capture",

        "hdmi",

        "usb",

        "video",

        "uvc"

    ];



    return Capture.devices.find(
        device =>{


            const name =
                device.label
                    .toLowerCase();



            return keywords.some(
                key =>
                    name.includes(key)
            );


        }
    );


}



/* =========================
   Start Capture
========================= */


async function startCapture(){


    try{


        await getDevices();



        let device =
            findCaptureDevice();



        if(!device){


            device =
                Capture.devices[0];

        }



        if(!device){


            throw new Error(
                "No camera found"
            );

        }



        console.log(
            "Using:",
            device.label
        );



        const constraints = {


            video:{


                deviceId:{
                    exact:
                    device.deviceId
                },


                width:{

                    ideal:1920

                },


                height:{

                    ideal:1080

                },


                frameRate:{

                    ideal:60

                }


            },


            audio:false


        };



        const stream =
            await navigator.mediaDevices
                .getUserMedia(
                    constraints
                );



        Capture.stream =
            stream;



        Capture.deviceId =
            device.deviceId;



        const video =
            document.getElementById(
                "video"
            );



        video.srcObject =
            stream;



        await video.play();



        HDMIView.stream =
            stream;



        Capture.connected =
            true;



        document
            .getElementById(
                "overlay"
            )
            .style.display =
                "none";



        setStatus(
            true,
            "Connected"
        );



        showToast(
            "HDMI Connected"
        );



    }catch(error){


        console.error(
            "Capture Error:",
            error
        );


        setStatus(
            false,
            "Error"
        );


        showToast(
            error.message
        );


    }


}



/* =========================
   Stop Capture
========================= */


function stopCapture(){


    if(
        Capture.stream
    ){


        Capture.stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


    }



    Capture.stream =
        null;



    Capture.connected =
        false;



    setStatus(
        false,
        "Disconnected"
    );



    showToast(
        "Disconnected"
    );


}



/* =========================
   Browser Support
========================= */


function checkSupport(){


    if(
        !navigator.mediaDevices ||
        !navigator.mediaDevices
            .getUserMedia
    ){


        showToast(
            "Browser not supported"
        );


        return false;


    }


    return true;


}



/* =========================
   Initialize
========================= */


window.addEventListener(
    "load",
    ()=>{


        checkSupport();


    }
);



/* =========================
   Export
========================= */


window.startCapture =
    startCapture;


window.stopCapture =
    stopCapture;


window.Capture =
    Capture;