'use strict'
let localVideo = document.querySelector('#localvideo');
let remoteVideo = document.querySelector('#remotevideo');
let start_btn = document.querySelector('#start');
let call_btn = document.querySelector('#call');
let hangup_btn = document.querySelector('#hangup');
let pc1,pc2;
function getMediaStream(stream){
    localVideo.srcObject = stream;
    window.stream = stream;
}
function handleErr(err){
    console.log(err);
}
function start(){
    let constraints = {
        video: true,
        audio: false
    }
    navigator.mediaDevices.getUserMedia(constraints).then(getMediaStream).catch(handleErr);
}
function getRemoteStream(e){
    remoteVideo.srcObject = e.streams[0];
}

function getLocalDescription(desc){
    pc1.setLocalDescription(desc);
    pc2.setRemoteDescription(desc);
    pc2.createAnswer().then(getAnswer).then(handleErr);
}
function getAnswer(desc){
    pc2.setLocalDescription(desc);
    pc1.setRemoteDescription(desc);
}
function call(){
    pc1 = new RTCPeerConnection();
    pc2 = new RTCPeerConnection();
    pc1.onicecandidate = (e) => {
        pc2.addIceCandidate(e.candidate);
    }
    pc2.onicecandidate = (e) => {
        pc1.addIceCandidate(e.candidate);
    }
    pc2.ontrack = getRemoteStream;
    window.stream.getTracks().forEach(
        (track) => {
            pc1.addTrack(track,window.stream);
        }
    )
    var offerOptions = {
        offerToRecieveAudio: 0,
        offerToRecieveVideo : 1
    }
    pc1.createOffer(offerOptions)
    .then(getLocalDescription)
    .catch(handleErr); 
}

function hangup(){
    pc1.close();
    pc2.close();
    pc1 = null;
    pc2 = null;
}
start_btn.onclick = start;
call_btn.onclick = call;
hangup_btn.onclick = hangup;