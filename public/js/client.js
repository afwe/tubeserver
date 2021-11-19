'use strict'
let audioSource = document.querySelector("select#audioSource");
let audioOutput = document.querySelector("select#audioOutput");
let videoSource = document.querySelector("select#videoSource");
if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices){
    console.log("dont support");
} else{
    navigator.mediaDevices.enumerateDevices().then(getDevices).catch(handleError)
}

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

function handleError(err){
    console.log(err);
}