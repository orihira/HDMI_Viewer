/* =====================================================
   HDMI View
   Capture Controller v1.2

   - Device selection
   - USB camera support
   - HDMI capture support
   - Quality selection support
===================================================== */


const Capture = {

    stream:null,

    devices:[],

    selectedDevice:null

};



const cameraSelect =
    document.getElementById(
        "cameraSelect"
    );



const qualitySelect =
    document.getElementById(
        "qualitySelect"
    );



/* =========================
   Get Cameras
========================= */


async function loadDevices(){


    try{


        // permission取得
        await navigator.mediaDevices
            .getUserMedia({
                video:true,
                audio:false
            });



        const devices =
            await navigator.mediaDevices
            .enumerateDevices();



        Capture.devices =
            devices.filter(
                d =>
                d.kind === "videoinput"
            );



        cameraSelect.innerHTML="";



        Capture.devices.forEach(
            (device,index)=>{


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    device.deviceId;


                option.textContent =
                    device.label ||
                    `Camera ${index+1}`;



                cameraSelect.appendChild(
                    option
                );


            }
        );



        console.log(
            "Camera list:",
            Capture.devices
        );



    }catch(error){


        console.error(error);


        showToast(
            "Camera detection failed"
        );

    }


}



/* =========================
   Quality Setting
========================= */


function getQualitySetting(){


    const quality =
        qualitySelect.value;



    let width = 1920;

    let height = 1080;

    let fps = 60;



    switch (quality) {


        case "1080p60":

            width = 1920;
            height = 1080;
            fps = 60;

            break;



        case "1080p30":

            width = 1920;
            height = 1080;
            fps = 30;

            break;



        case "720p60":

            width = 1280;
            height = 720;
            fps = 60;

            break;



        case "720p30":

            width = 1280;
            height = 720;
            fps = 30;

            break;



        case "480p30":

            width = 640;
            height = 480;
            fps = 30;

            break;



        case "auto":

            width = undefined;
            height = undefined;
            fps = undefined;

            break;


    }



    return {

        width,
        height,
        fps

    };


}
/* =========================
   Start Capture
========================= */


async function startCapture(){


    try{


        const deviceId =
            cameraSelect.value;



        if(!deviceId){


            throw new Error(
                "No camera selected"
            );


        }



        /*
            Connectを押した時点の
            品質設定を取得
        */

        const quality =
            getQualitySetting();



        if(Capture.stream){


            stopCapture();


        }



        const constraints = {


            video:{


                deviceId:{


                    exact:deviceId


                },


                width:
                    quality.width
                    ?
                    {
                        ideal:
                        quality.width
                    }
                    :
                    undefined,



                height:
                    quality.height
                    ?
                    {
                        ideal:
                        quality.height
                    }
                    :
                    undefined,



                frameRate:
                    quality.fps
                    ?
                    {
                        ideal:
                        quality.fps
                    }
                    :
                    undefined


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





        const video =
            document.getElementById(
                "video"
            );





        video.srcObject =
            stream;





        await video.play();





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





        const settings =
            stream
            .getVideoTracks()[0]
            .getSettings();





        showToast(

            `${settings.width}×${settings.height} ${settings.frameRate || "?"}fps`

        );





        console.log(

            "Connected device:",

            cameraSelect
            .selectedOptions[0]
            .text

        );





        console.log(

            "Quality:",

            quality

        );





    }catch(error){



        console.error(

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
   Stop
========================= */


function stopCapture(){


    if(Capture.stream){


        Capture.stream
        .getTracks()
        .forEach(

            track =>
            track.stop()

        );


    }



    Capture.stream = null;



    setStatus(

        false,

        "Disconnected"

    );


}



/* =========================
   Init
========================= */


window.addEventListener(

    "load",

    loadDevices

);





window.startCapture =

    startCapture;





window.stopCapture =

    stopCapture;





window.Capture =

    Capture;
