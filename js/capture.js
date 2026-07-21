/* =====================================================
   HDMI View
   Capture Controller v1.3

   - Device selection
   - USB camera support
   - HDMI capture support
   - Quality selection support
   - On-screen debug log panel
     (MDM管理下のiPadでMac接続が
      できない環境向け)
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
   On-screen Debug Panel

   画面右下に半透明のログパネルを
   自動生成して、そこに console.log /
   console.warn / console.error の
   内容をそのまま表示する。

   HTML側の変更は不要。
========================= */


const DebugPanel = {

    el:null,

    logEl:null,

    visible:true

};



function createDebugPanel(){


    const panel =
        document.createElement("div");


    panel.id =
        "debug-panel";


    panel.style.cssText = `
        position:fixed;
        left:0;
        right:0;
        bottom:0;
        max-height:40vh;
        overflow-y:auto;
        background:rgba(0,0,0,0.85);
        color:#0f0;
        font-family:monospace;
        font-size:11px;
        line-height:1.4;
        padding:8px;
        padding-bottom:24px;
        z-index:99999;
        white-space:pre-wrap;
        word-break:break-all;
        box-sizing:border-box;
    `;



    const toggleBtn =
        document.createElement("button");


    toggleBtn.textContent =
        "Log";


    toggleBtn.style.cssText = `
        position:fixed;
        right:8px;
        bottom:8px;
        z-index:100000;
        background:#333;
        color:#fff;
        border:1px solid #666;
        border-radius:6px;
        padding:6px 10px;
        font-size:12px;
        opacity:0.8;
    `;


    toggleBtn.addEventListener(
        "click",
        ()=>{

            DebugPanel.visible =
                !DebugPanel.visible;


            panel.style.display =
                DebugPanel.visible
                ?
                "block"
                :
                "none";

        }
    );



    const clearBtn =
        document.createElement("button");


    clearBtn.textContent =
        "Clear";


    clearBtn.style.cssText = `
        position:fixed;
        right:64px;
        bottom:8px;
        z-index:100000;
        background:#333;
        color:#fff;
        border:1px solid #666;
        border-radius:6px;
        padding:6px 10px;
        font-size:12px;
        opacity:0.8;
    `;


    clearBtn.addEventListener(
        "click",
        ()=>{

            panel.textContent =
                "";

        }
    );



    document.body.appendChild(
        panel
    );


    document.body.appendChild(
        toggleBtn
    );


    document.body.appendChild(
        clearBtn
    );



    DebugPanel.el =
        panel;

}



function appendDebugLine(
    level,
    args
){


    if(!DebugPanel.el){

        return;

    }


    const time =
        new Date()
        .toLocaleTimeString();


    let text;


    try{


        text =
            args
            .map(a=>{

                if(
                    typeof a === "object"
                ){

                    return JSON.stringify(
                        a,
                        null,
                        2
                    );

                }

                return String(a);

            })
            .join(" ");


    }catch(e){


        text =
            "[unserializable log]";


    }



    const color =

        level === "error"
        ?
        "#f55"
        :
        level === "warn"
        ?
        "#fd5"
        :
        "#0f0";



    const line =
        document.createElement(
            "div"
        );


    line.style.color =
        color;


    line.textContent =
        `[${time}] ${text}`;



    DebugPanel.el.appendChild(
        line
    );



    DebugPanel.el.scrollTop =
        DebugPanel.el.scrollHeight;

}



function hookConsole(){


    const original = {

        log:console.log,

        warn:console.warn,

        error:console.error

    };



    ["log","warn","error"].forEach(
        level=>{

            console[level] =
                (...args)=>{

                    original[level](
                        ...args
                    );


                    appendDebugLine(
                        level,
                        args
                    );

                };

        }
    );



    /*
        画面上で拾えなかった
        エラーも表示する
    */

    window.addEventListener(
        "error",
        (e)=>{

            appendDebugLine(
                "error",
                [
                    `Uncaught: ${e.message}`,
                    `(${e.filename}:${e.lineno})`
                ]
            );

        }
    );


    window.addEventListener(
        "unhandledrejection",
        (e)=>{

            appendDebugLine(
                "error",
                [
                    "Unhandled rejection:",
                    e.reason
                ]
            );

        }
    );

}



window.addEventListener(
    "load",
    ()=>{

        createDebugPanel();

        hookConsole();

        console.log(
            "Debug panel ready"
        );

    }
);



/* =========================
   Realtime FPS Monitor

   getSettings()のframeRateは
   「要求値」でしかないので、
   実際に届いているフレーム数を
   video.requestVideoFrameCallback()
   で直接カウントして
   画面に表示する。
========================= */


const FpsMonitor = {

    active:false,

    count:0,

    lastReportTime:0,

    badgeEl:null

};



function createFpsBadge(){


    const badge =
        document.createElement("div");


    badge.id =
        "fps-badge";


    badge.style.cssText = `
        position:fixed;
        left:8px;
        top:8px;
        z-index:100000;
        background:rgba(0,0,0,0.7);
        color:#0f0;
        font-family:monospace;
        font-size:13px;
        padding:4px 8px;
        border-radius:6px;
        pointer-events:none;
    `;


    badge.textContent =
        "-- fps";


    document.body.appendChild(
        badge
    );


    FpsMonitor.badgeEl =
        badge;

}



function startFpsMonitor(video){


    if(
        !video.requestVideoFrameCallback
    ){


        console.warn(
            "requestVideoFrameCallback is not supported. Realtime FPS unavailable."
        );


        return;

    }



    if(!FpsMonitor.badgeEl){

        createFpsBadge();

    }



    FpsMonitor.active =
        true;


    FpsMonitor.count =
        0;


    FpsMonitor.lastReportTime =
        performance.now();



    function onFrame(
        now,
        metadata
    ){


        if(!FpsMonitor.active){

            return;

        }



        FpsMonitor.count++;



        const elapsed =
            now -
            FpsMonitor.lastReportTime;



        if(elapsed >= 1000){


            const fps =
                (
                    FpsMonitor.count /
                    (elapsed/1000)
                )
                .toFixed(1);



            if(FpsMonitor.badgeEl){

                FpsMonitor.badgeEl.textContent =
                    `${fps} fps (real)`;

            }



            console.log(
                `Realtime FPS: ${fps}`
            );



            FpsMonitor.count =
                0;


            FpsMonitor.lastReportTime =
                now;


        }



        video.requestVideoFrameCallback(
            onFrame
        );

    }



    video.requestVideoFrameCallback(
        onFrame
    );

}



function stopFpsMonitor(){


    FpsMonitor.active =
        false;


    if(FpsMonitor.badgeEl){

        FpsMonitor.badgeEl.textContent =
            "-- fps";

    }

}



/* =========================
   Screenshot
   (無音: OSのスクリーンショット機能を
   使わず、canvasでフレームを直接
   画像化して保存する)
========================= */


function takeScreenshot(){


    const video =
        document.getElementById(
            "video"
        );



    if(
        !video ||
        !video.videoWidth
    ){


        showToast(
            "No video to capture"
        );


        return;

    }



    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        video.videoWidth;


    canvas.height =
        video.videoHeight;



    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );



    canvas.toBlob(
        (blob)=>{


            if(!blob){


                showToast(
                    "Screenshot failed"
                );


                return;

            }



            const url =
                URL.createObjectURL(
                    blob
                );



            const a =
                document.createElement(
                    "a"
                );


            const stamp =
                new Date()
                .toISOString()
                .replace(/[:.]/g,"-");


            a.href =
                url;


            a.download =
                `hdmiview-${stamp}.png`;


            document.body.appendChild(
                a
            );


            a.click();


            a.remove();



            URL.revokeObjectURL(
                url
            );



            showToast(
                "Screenshot saved"
            );


        },
        "image/png"
    );

}



/* =========================
   In-app Recording
   (無音: iOSの画面収録を使わず、
   MediaRecorderで映像ストリームを
   直接録画する)
========================= */


const Recorder = {

    active:false,

    recorder:null,

    chunks:[],

    startTime:0,

    timerInterval:null

};



function pickRecorderMimeType(){


    const candidates = [

        "video/mp4",

        "video/webm;codecs=vp9",

        "video/webm;codecs=vp8",

        "video/webm"

    ];



    for(
        const type of candidates
    ){


        if(
            window.MediaRecorder &&
            MediaRecorder.isTypeSupported(
                type
            )
        ){


            return type;

        }

    }



    return "";

}



function startRecording(){


    if(
        !Capture.stream
    ){


        showToast(
            "Not connected"
        );


        return;

    }



    if(
        !window.MediaRecorder
    ){


        showToast(
            "Recording not supported"
        );


        return;

    }



    const mimeType =
        pickRecorderMimeType();



    try{


        Recorder.recorder =
            new MediaRecorder(
                Capture.stream,
                mimeType
                ?
                { mimeType }
                :
                undefined
            );


    }catch(error){


        console.error(
            error
        );


        showToast(
            "Recording failed to start"
        );


        return;

    }



    Recorder.chunks = [];



    Recorder.recorder.ondataavailable =
        (e)=>{


            if(
                e.data &&
                e.data.size > 0
            ){


                Recorder.chunks.push(
                    e.data
                );

            }

        };



    Recorder.recorder.onstop =
        ()=>{


            saveRecording(
                mimeType ||
                "video/webm"
            );

        };



    Recorder.recorder.start();



    Recorder.active =
        true;


    Recorder.startTime =
        performance.now();



    updateRecordButton();



    Recorder.timerInterval =
        setInterval(
            updateRecordButton,
            500
        );



    console.log(
        "Recording started:",
        mimeType
    );

}



function stopRecording(){


    if(
        !Recorder.recorder ||
        !Recorder.active
    ){


        return;

    }



    Recorder.recorder.stop();



    Recorder.active =
        false;



    clearInterval(
        Recorder.timerInterval
    );



    updateRecordButton();

}



function saveRecording(
    mimeType
){


    const blob =
        new Blob(
            Recorder.chunks,
            { type:mimeType }
        );



    const ext =
        mimeType.includes("mp4")
        ?
        "mp4"
        :
        "webm";



    const url =
        URL.createObjectURL(
            blob
        );



    const a =
        document.createElement(
            "a"
        );


    const stamp =
        new Date()
        .toISOString()
        .replace(/[:.]/g,"-");


    a.href =
        url;


    a.download =
        `hdmiview-${stamp}.${ext}`;


    document.body.appendChild(
        a
    );


    a.click();


    a.remove();



    URL.revokeObjectURL(
        url
    );



    Recorder.chunks = [];



    showToast(
        "Recording saved"
    );

}



function toggleRecording(){


    if(
        Recorder.active
    ){


        stopRecording();


    }else{


        startRecording();


    }

}



function formatElapsed(ms){


    const totalSec =
        Math.floor(
            ms/1000
        );


    const min =
        Math.floor(
            totalSec/60
        )
        .toString()
        .padStart(2,"0");


    const sec =
        (totalSec%60)
        .toString()
        .padStart(2,"0");


    return `${min}:${sec}`;

}



function updateRecordButton(){


    if(
        !RecordButton.el
    ){


        return;

    }



    if(
        Recorder.active
    ){


        const elapsed =
            performance.now() -
            Recorder.startTime;


        RecordButton.el.textContent =
            `⏹ ${formatElapsed(elapsed)}`;


        RecordButton.el.style.background =
            "var(--error-color)";


        RecordButton.el.style.animation =
            "pulse 2s infinite";


    }else{


        RecordButton.el.textContent =
            "⏺ Rec";


        RecordButton.el.style.background =
            "";


        RecordButton.el.style.animation =
            "none";


    }

}



/* =========================
   Capture Toolbar
   (Screenshot / Record buttons
   を既存のnavバーに追加)
========================= */


const RecordButton = {

    el:null

};



function createCaptureToolbarButtons(){


    const nav =
        document.querySelector(
            "nav"
        );



    if(!nav){


        console.warn(
            "nav element not found, skipping toolbar buttons"
        );


        return;

    }



    if(
        document.getElementById(
            "screenshotButton"
        )
    ){


        return;

    }



    const shotButton =
        document.createElement(
            "button"
        );


    shotButton.id =
        "screenshotButton";


    shotButton.textContent =
        "📷 Shot";


    shotButton.addEventListener(
        "click",
        takeScreenshot
    );



    const recButton =
        document.createElement(
            "button"
        );


    recButton.id =
        "recordButton";


    recButton.textContent =
        "⏺ Rec";


    recButton.addEventListener(
        "click",
        toggleRecording
    );



    nav.appendChild(
        shotButton
    );


    nav.appendChild(
        recButton
    );



    RecordButton.el =
        recButton;

}



window.addEventListener(
    "load",
    createCaptureToolbarButtons
);



window.takeScreenshot =
    takeScreenshot;



window.toggleRecording =
    toggleRecording;



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



        console.log(
            "Constraints:",
            constraints
        );





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



        startFpsMonitor(
            video
        );





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





        const track =
            stream
            .getVideoTracks()[0];



        const settings =
            track.getSettings();



        /* =========================
           Debug: Settings / Capabilities

           実際にブラウザが選んだ設定と、
           デバイスが本来対応できる範囲を
           確認するためのログ。

           特に frameRate の max値が低い場合は
           YUY2などの無圧縮フォーマットを
           掴んでいる可能性が高い。

           右下の「Log」ボタンで
           画面上に表示される。
        ========================= */

        console.log(
            "Settings:",
            settings
        );


        if(track.getCapabilities){

            const capabilities =
                track.getCapabilities();

            console.log(
                "Capabilities:",
                capabilities
            );

        }else{

            console.warn(
                "getCapabilities() is not supported on this browser."
            );

        }





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


    stopFpsMonitor();


    if(Recorder.active){

        stopRecording();

    }



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
