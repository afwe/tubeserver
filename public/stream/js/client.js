'use strict'
let videoplay = document.querySelector('video#play');
let audioSource = document.querySelector("select#audioSource");
let audioOutput = document.querySelector("select#audioOutput");
let videoSource = document.querySelector("select#videoSource");
let filter = document.querySelector("select#filter");
let screenshot=document.querySelector("#screenshot");
let picture=document.querySelector("#picture");
let recplay = document.querySelector("#recplay");
let startrec_button = document.querySelector("#startrec");
let recplay_button = document.querySelector("#recplay-btn");
let download_button = document.querySelector("#download");

function getDevices(deviceInfo){
    deviceInfo.forEach((data)=>{
        console.log(data.kind+" AND"+data.label+" AND "+data.deviceId+" AND "+data.groupId);
        let option = document.createElement('option');
        option.text = data.label;
        option.value = data.deviceId;
        if(data.kind == "audioinput"){
            audioSource.appendChild(option);
        }else if(data.kind == "videoinput"){
            videoSource.appendChild(option);
        }else if(data.kind=="audiooutput"){
            audioOutput.appendChild(option);
        }
    });
}
function getMediaStream(stream){
    videoplay.srcObject = stream;
    window.stream=stream;
    return navigator.mediaDevices.enumerateDevices();
}
function handleErr(err){
    console.log(err)
}

function start(){
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){

}else{
    let constraints = {
        video : {
            width: 420,
            height: 300,
            frameRate: 10
        },
        audio : false
        /*{
            echoCancellation: true
        }*/
    }
    navigator.mediaDevices.getUserMedia(constraints).then(getMediaStream).then(getDevices).catch(handleErr)
}
}
start();
videoSource.onchange = start;
filter.onchange=function(){
    videoplay.className=filter.value;
}
screenshot.onclick=function(){
    picture.getContext('2d').drawImage(videoplay,
        0,0,picture.width,picture.height);
}

let buffer = [];
function handleDataAvailable(e){
    if(e&&e.data.size>0){
        buffer.push(e.data);
    }
}
let mediaRecorder;
startrec=function(){
    let option = {
        mimeType: 'video/webm;codecs=vp8'
    }
    mediaRecorder = new MediaRecorder(window.stream,option);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10);
}
function stoprec(){
    mediaRecorder.stop();
}
startrec_button.onclick=function(){
    if(startrec_button.textContent=="录制"){
        startrec();
        startrec_button.textContent="停止";
    } else{
        stoprec();
        startrec_button.textContent="录制";
    }
}

recplay_button.onclick = ()=>{
    let blob = new Blob(buffer,{type:'video/webm'});
    recplay.src = window.URL.createObjectURL(blob);
    recplay.srcObject = null;
    recplay.controls = true;
    recplay.play();
}

download_button.onclick= ()=>{
    let blob = new Blob(buffer, {type:'video/webm'});
    let url=window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.style.display='none';
    a.download = 'aaa.webm';
    a.click();
}