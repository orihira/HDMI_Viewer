/* =====================================================
   HDMI View
   Capture Controller v1.1

   - Device selection
   - USB camera support
   - HDMI capture support
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



        if(Capture.stream){


            stopCapture();

        }



        const constraints = {


            video:{


                deviceId:{
                    exact:
                    deviceId
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


        showToast(
            "Connected"
        );


        console.log(
            "Connected device:",
            cameraSelect.selectedOptions[0].text
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


    Capture.stream=null;


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
