(function ($) {
    $.fn.facerecognize = function (options) {
        // Default options
        var settings = $.extend({
            isMobile: false,
            apiFaceCheck: '/Home/FaceCheck/',
        }, options);

        this.each(function () {
            var $element = $(this);
            if (!settings.isMobile) {
                $element.append(pcElement);
            }
            else
                $element.append(mobileElement);
        });

        const apiCheckFace = settings.apiFaceCheck;
        let deviceWidth = $(window).width();
        let action = 0;
        let actionArray = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
        let indexActionArray = 0;
        let centerX, noseTip, facemesh, interval;
        let valueCircle = 800;
        const isMobile = settings.isMobile;
        let cameras = [];
        let currentCamera, currentStream, currentConstrains, facingMode, canvas;
        const video = $('#camera')[0]

        $(document).ready(
            async function () {
                isMobile = $("#IsMobile").val() == 1 ? true : false;
                await findBestCamera(1);
                await startCamera()
                async function loadFaceMesh() {
                    if (!facemesh) {
                        facemesh = await window.facemesh.load({
                            scale: 0.8,
                        });
                    }
                }

                if ((!isMobile && cameras.length > 1) || isMobile)
                    $(".btnSwapCam").removeClass("d-none");
                await loadFaceMesh();
                startLiveness();
            },

            $('.btnReTry').click(function () {
                reset();
            })
        );
        async function startCamera() {
            try {
                if (isMobile === true) {
                    facingMode = "user";
                    $(".camera-wrap").css('height', "70vh");
                }
                if (isMobile) {
                    currentConstrains = {
                        audio: false,
                        video: {
                            facingMode: facingMode,
                        }
                    }
                }
                else {
                    currentConstrains = {
                        audio: false,
                        video: {
                            width: 640,
                            height: 360,
                        }
                    }
                }
                const stream = await navigator.mediaDevices.getUserMedia(
                    currentConstrains
                );
                currentStream = stream;
                video.style.width = "100%";
                video.srcObject = stream;

            } catch (error) {
                alert("Lỗi khi truy cập camera");
            }
        }
        async function findBestCamera(type) {
            /* try {
                 navigator.mediaDevices.getUserMedia({
                     video: true,
                     audio: false,
                 });
                 const devices = await navigator.mediaDevices.enumerateDevices();
                 cameras = devices.filter(device => device.kind === 'videoinput');
                 if (cameras.length === 0) {
                    alert("Không tìm thấy camera");
                    return;
                 }
                 currentCamera = cameras.filter(camera => camera.label.includes('facing front'))[0] || cameras[0];
                 if (type === 1) {
                     facingMode = "user";
                     $(".camera-wrap").css('height', "70vh");
                 }
                 if (isMobile) {
                     currentConstrains = {
                         audio: false,
                         video: {
                             facingMode: facingMode,
                         }
                     }
                 }
                 else {
                     currentConstrains = {
                         audio: false,
                         video: {
                             deviceId: { exact: currentCamera.deviceId },
                             width: 640,
                             height: 360,
                         }
                     }
                 }
             }
             catch (error) {
                alert("Không tìm thấy camera");
             }*/

        }
        async function handleChangeCamera(parameter) {
            $("#camera").removeClass("animate__fadeOut");
            $(".svg-cardFrame").addClass('d-none');
            $("#camera")[0].offsetWidth;

            setTimeout(function () {
                $("#camera").addClass("animate__fadeOut");
            }, 100);

            if (!isMobile) {
                const currentIndex = cameras.indexOf(currentCamera);
                if (currentIndex === -1) {
                    return null;
                }
                const nextIndex = (currentIndex + 1) % cameras.length;
                currentCamera = cameras[nextIndex];
                currentConstrains.video.deviceId = { exact: currentCamera.deviceId };
            }
            else {
                if (parameter) {
                    currentConstrains.video.facingMode = 'user'
                }
                else
                    currentConstrains.video.facingMode = currentConstrains.video.facingMode === 'user' ? 'environment' : 'user';
            }
            await startCamera();

        }
        function startLiveness() {
            interval = setInterval(async function () {
                await dectect(facemesh);
            }, 1000);

            interval;
        }
        async function dectect(facemesh) {
            const face = await facemesh.estimateFaces(video);
            if (face.length !== 1) {
            }
            else {
                if (face[0]?.faceInViewConfidence < 1) {
                    showOverlayText("Đưa khuôn mặt vào giữa khung hình");
                }
                else {
                    const rightX = face[0].boundingBox.bottomRight[0];

                    const leftX = face[0].boundingBox.topLeft[0];

                    let noseTipA = face[0].annotations.noseTip[0];
                    if (!isMobile) {
                        if (noseTipA[0] < 180 || noseTipA[0] > 420 || noseTipA[1] < 180 || noseTipA[1] > 300) {
                            showOverlayText("Đưa khuôn mặt vào giữa khung hình");
                            return;
                        }
                        else {
                            showOverlayText();
                        }
                    } else {
                        if (noseTipA[0] < deviceWidth / 2 - 120 || noseTipA[0] > deviceWidth / 2 + 120 || noseTipA[1] < 280 || noseTipA[1] > 480) {
                            showOverlayText("Đưa khuôn mặt vào giữa khung hình");
                            return;
                        }
                        else {
                            showOverlayText();
                        }
                    }

                    noseTip = noseTipA[0];
                    centerX = leftX + (rightX - leftX) / 2;
                    switch (action) {
                        case 0:
                            const rightY = face[0].boundingBox.bottomRight[1];
                            const leftY = face[0].boundingBox.topLeft[1];
                            centerY = leftY + (rightY - leftY) / 2;
                            getNextAction(actionArray);
                            break;
                        case 1:
                            if (centerX + 30 < noseTip) {
                                getNextAction(actionArray);
                            }
                            break;
                        case 2:
                            if (centerX - 30 > noseTip) {
                                getNextAction(actionArray);

                            }
                            break;
                        case 3:
                            if (centerY + 30 < noseTipA[1]) {
                                getNextAction(actionArray);
                            }
                            break;
                        case 4:
                            if (centerY > noseTipA[1]) {
                                getNextAction(actionArray);
                            }
                            break;
                        case 5:
                            clearInterval(interval);
                            setTimeout(function () {
                                showResultDiv();
                                canvas = $('#canvas')[0];
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                canvas.getContext('2d')
                                    .drawImage(video, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob(async function (blob) {
                                    requestSent = true;
                                    const formData = new FormData();
                                    formData.append('FaceImage', blob);
                                    var response = await fetch('/Home/FaceCheck/',
                                        {
                                            method: 'POST',
                                            credentials: 'include',
                                            body: formData,
                                        })

                                    requestSent = false;
                                    response = await response.json();

                                    hideOverlay();
                                    showResultDiv(response.Status);

                                    if (response.Status === 200) {
                                        location = response.Data;
                                    }
                                    console.log(response);
                                }, 'image/png', 1);

                            }, 2000);


                            getNextAction(actionArray);
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        function drawCircle() {
            valueCircle -= 200;
            if (valueCircle >= 0)
                $('.circle').attr('stroke-dashoffset', valueCircle);
        }
        function getFaceMatching() {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: endPoints.apiFaceMatching,
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (response) {
                        if (response.Status === 2) {
                            resolve(response.Data);
                        } else {
                            if (!isMobile)
                                $("#container-pc").append(modal);
                            else
                                $("#container-mobile").append(modal);
                            reject('Face matching request failed with status ' + response.Status); // Updated error message
                        }
                    },
                    error: function (xhr, status, error) {
                        isSuccessOCR = false;
                        reject('Face matching request failed with status ' + status + ' and error ' + error);
                    }
                });
            });
        }
        function showOverlayText(instruction) {
            if (instruction) {
                $('#instruction-text').text(instruction);
            }
            else {
                switch (action) {
                    case 1:
                        instruction = "Quay trái"
                        break;
                    case 2:
                        instruction = "Quay phải";
                        break;
                    case 3:
                        instruction = "Quay xuống dưới";
                        break;
                    case 4:
                        instruction = "Quay lên trên";
                        break;
                    case 5:
                        instruction = "Giữ nguyên khuôn mặt";
                        break;
                    default:
                        break;
                }
                $('#instruction-text').text(instruction);
                $('#overlayText').fadeIn();
            }

        }
        function hideOverlay() {
            $('#overlayText').fadeOut();
        }
        function showResultDiv(result) {
            const div = $('.result-div');
            div.removeClass('d-none');
            div.addClass('show');
            setTimeout(() => {
                div.addClass('visible');
            }, 10);
            if (!result) {
                div.find('.result-item').html(`<div class="spinner-border text-success" style="color: var(--main-color) !important; border-width: 3px !important;" role="status"></div>`);
            }
            else if (result === 200) {
                div.find('.result-item').html('<div> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check">\n' +
                    '                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>\n' +
                    '                                    <path d="M5 12l5 5l10 -10"/>\n' +
                    '                                     </svg>' +
                    '                                       <span>Thành công</span></div>');
            }
            else {
                div.find('.result-item').html('<div class="text-danger"><svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg><span>Thất bại</span></div>');
                $('.btnReTry').removeClass('d-none');
            }

        }
        function getNextAction() {
            if (action > 0)
                drawCircle();
            if (indexActionArray < actionArray.length) {
                action = actionArray[indexActionArray++];
                showOverlayText();
            } else {
                action = 5;
                showOverlayText();
            }
        }
        function reset() {
            action = 0;
            actionArray = [1, 2, 3, 4].sort(() => Math.random() - 0.5);

            valueCircle = 800;
            $('.circle').attr('stroke-dashoffset', valueCircle);
            indexActionArray = 0;
            $('.result-div').addClass('d-none');
            $('.btnReTry').addClass('d-none');
            showOverlayText("Đưa khuôn mặt vào giữa khung hình");
            setTimeout(function () {
                startLiveness()
            }, 2000)

        }

        // Maintain chainability
        return this;
    };



})(jQuery);




;







let pcElement = `<div id="container-pc">
                <input type="hidden" id="IsMobile" value="0" />
                <div class="d-flex justify-content-center align-items-center faceCheck-container">
                    <div style="min-height:416px;">
                        <div class="camera-wrap">
                            <div class="d-flex" style="height:360px;">
                                <video id="camera" autoplay muted playsinline></video>
                                <canvas id="canvas" class="d-none"></canvas>
                                <div class="result-div d-none">
                                    <div class="result-item">
                                    </div>

                                </div>
                            </div>
                            <div class="w-100 d-flex justify-content-center bg-dark">
                                <img id="imageUpload" src="" class="d-none" />
                            </div>

                            <div id="overlayText">
                                <div id="instruction-text">Để khuôn mặt vào giữa khung hình</div>
                            </div>

                            <div id="svg-container">
                                <svg id="custom-svg" class="WebcamCapture_ellipse__4o13l" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" viewBox="0 0 640 360" rotate="100deg" action="0" style="position: absolute; top: 0px; left: 0px;">
                                    <defs>
                                        <mask id="bgClip">
                                            <rect x="0" y="0" width="640" height="360" fill="#fff" />
                                            <ellipse cx="320" cy="180" rx="122" ry="122" />
                                        </mask>
                                        <mask id="readinessMask" x="0" y="0">
                                            <circle fill="white" r="0" cx="320" cy="180" />
                                            <ellipse cx="320" cy="180" rx="122" ry="122" />
                                        </mask>
                                        <mask id="ovalClip">
                                            <rect x="0" y="0" width="640" height="360" fill="#fff" />
                                        </mask>
                                    </defs>
                                    <rect mask="url(#bgClip)" x="0" y="0" width="640" height="360" fill="rgb(0,0,0,0.8)" />
                                    <defs>
                                        <mask id="targetSectorMask" x="0" y="0">
                                            <circle stroke-width="62.5" r="125" cx="320" cy="180" fill="" stroke="white" />
                                            <ellipse cx="320" cy="180" rx="126" ry="126" />
                                        </mask>
                                    </defs>
                                    <ellipse mask="url(#ovalClip)" id="animated-ellipse" class=" " cx="320" cy="180" rx="132" ry="132" fill="none" stroke-dasharray="3 5" stroke="#BFBFBF" stroke-width="8" />
                                    <ellipse mask="url(#ovalClip)" class="circle" cx="320" cy="180" rx="126" ry="126" fill="none" stroke="var(--color-main)" stroke-width="5" stroke-dasharray="800" stroke-dashoffset="800" />
                                </svg>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center mt-3">
                            <button class="btn btn-ui btnReTry shadow d-none" onclick="handleCapture()">Thử lại</button>
                        </div>
                    </div>

                </div>

            </div>`
let mobileElement = ` <div id="container-mobile">
                <input type="hidden" id="IsMobile" value="1" />
                <div class="d-flex justify-content-center " style="width:100%;">
                    <div style="width: 100%; ">
                        <div class="camera-wrap">
                            <!-- Your camera feed element -->
                            <video id="camera" class="animate__flipInX" autoplay muted playsinline></video>
                            <canvas id="canvas" style="display: none;"></canvas>
                            <div class="result-div d-none">
                                <div class="result-item">
                                </div>

                            </div>
                            <!-- Overlay for instructions -->
                            <div id="overlayText" class="">
                                <div id="instruction-text">Đưa khuôn mặt vào giữ khung hình</div>
                            </div>

                            <!--SVG container-->
                            <div id="svg-container">
                                <svg id="custom-svg" class="WebcamCapture_ellipse__4o13l" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 542" rotate="100deg" action="0">
                                    <defs>
                                        <mask id="bgClip">
                                            <rect x="0" y="0" width="400" height="542" fill="#fff" />
                                            <ellipse cx="200" cy="271" rx="122" ry="122" />
                                        </mask>
                                        <mask id="readinessMask" x="0" y="0">
                                            <circle fill="white" r="0" cx="200" cy="271" />
                                            <ellipse cx="200" cy="271" rx="122" ry="122" />
                                        </mask>
                                        <mask id="ovalClip">
                                            <rect x="0" y="0" width="400" height="542" fill="#fff" />
                                        </mask>
                                    </defs>
                                    <rect mask="url(#bgClip)" x="0" y="0" width="400" height="542" fill="rgba(255,255,255,1)" />
                                    <defs>
                                        <mask id="targetSectorMask" x="0" y="0">
                                            <circle stroke-width="62.5" r="125" cx="200" cy="271" fill="" stroke="white" />
                                            <ellipse cx="200" cy="271" rx="122" ry="122" />
                                        </mask>
                                    </defs>
                                    <ellipse mask="url(#ovalClip)" id="animated-ellipse" class=" " cx="200" cy="271" rx="132" ry="132" fill="none" stroke-dasharray="3 5" stroke="#ccc" stroke-width="12" />
                                    <ellipse mask="url(#ovalClip)" class="circle" cx="200" cy="271" rx="124" ry="124" fill="none" stroke="#04a537" stroke-width="4" stroke-dasharray="800" stroke-dashoffset="780" />
                                </svg>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center mt-3">
                            <button class="btn btn-ui btnReTry shadow d-none" onclick="handleCapture()">Thử lại</button>
                        </div>
                    </div>

                </div>
            </div>`