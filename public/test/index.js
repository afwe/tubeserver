'use strict'
let lovalVideo = document.querySelector('video#localVideo');
let remoteVideo = document.querySelector('video#remoteVideo');

let conn_btn = document.querySelector('button#connect');
let discon_btn = document.querySelector('button#disconnect');

let localStream = null;
let roomId = '111111';
let socket = null;
let state = 'init';
let pc;
let peerConnectionCollection = [];

function handleErr(err){
    console.error(err);
}
function sendMessage(id,data){
    if(socket){
        socket.emit('message',id,data);
    }
}
function getOffer(desc,masterId){
    pc.setLocalDescription(desc);
    sendMessage(masterId,desc);
}
function call(masterId){
    if(pc){
        console.log('pcsurvive');
        let options = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        }
        if(state == 'slave'){
            console.log('offercall');
            pc.createOffer(options)
            .then((desc)=>{
                getOffer(desc,masterId);
            })
            .catch(handleErr)
        }
    }
}

function getMediaStream(stream){
    localStream = stream;
    localVideo.srcObject = localStream;
}
function masterGetOffer(id,message){
    console.log(id);
    peerConnectionCollection[id].setRemoteDescription(new RTCSessionDescription(message));
    peerConnectionCollection[id].createAnswer().then((answer)=>{getAnswer(answer,id)}).catch(handleErr);
}
function masterAddCandidate(id,candidate){
    peerConnectionCollection[id].addIceCandidate(candidate).catch();
}
function getAnswer(desc,id){
    peerConnectionCollection[id].setLocalDescription(desc);
    sendMessage(id,desc);
}
function initSocketIO(){
    socket = io.connect();

    socket.on('newSlave',(id)=>{
        masterCreatePeerConnection(id);
    })
    socket.on('masterId',(id)=>{
        console.log(id);
        call(id);
    })
    socket.on('identify',(identity, id)=>{
        console.log(identity);
        state = identity;
        if(identity == "master") {
            socket.on('message',(id, message)=>{
                console.log(message);
                if(message){
                    if(message.type==='offer'){
                        console.log("offermessage");
                        masterGetOffer(id,message);
                    }else if (message.type==='candidate'){
                        console.log("candidatemessage");
                        let candidate = new RTCIceCandidate({
                            sdpMLineIndex: message.label,
                            candidate: message.candidate
                        })
                        masterAddCandidate(id,candidate);
                    }
                }
            })
        }
        start();
    })

    socket.on('leave',(roomId, id)=>{
        socket.disconnected();
        closePeerConnection();
        closeLocal();
        console.log('leave');
    })

    socket.emit('join',roomId);
    return;
}
let pcConfig = {
    iceServers:[
        {
            urls: ["stun:afweshuaige.ltd:3478"]
        },
        {
            urls: ['turn:afweshuaige.ltd:3478?transport=udp'],
            credential: '1234',
            username: 'afwe',
        }
    ],
}

function slaveCreatePeerConnection(){
    if(!pc){
        pc = new RTCPeerConnection(pcConfig);
        pc.onicecandidate = (e)=> {
            if(e.candidate){
                console.log("candidateOn");
                sendMessage('slave',{
                    type:'candidate',
                    label: e.candidate.sdpMLineIndex,
                    id: e.candidate.sdpMid,
                    candidate: e.candidate.candidate
                })
            }
        }
        pc.ontrack = (e)=>{
            console.log("track");
            console.log(e);
            remoteVideo.srcObject = e.streams[0];
        }
        socket.on('message',(id, message)=>{
            console.log(message);
            if(message){
                if(message.type==='answer'){ 
                    console.log("answermessage");
                    pc.setRemoteDescription(new RTCSessionDescription(message));
                }else if (message.type==='candidate'){
                    console.log("candidatemessage");
                    let candidate = new RTCIceCandidate({
                        sdpMLineIndex: message.label,
                        candidate: message.candidate
                    })
                    pc.addIceCandidate(candidate).catch();
                }
            }
        })
    }
}

function masterCreatePeerConnection(slaveId){
    console.log(slaveId);
    peerConnectionCollection[slaveId] = new RTCPeerConnection(pcConfig);
    pc = peerConnectionCollection[slaveId];
    pc.onicecandidate = (e)=> {
        if(e.candidate){
            console.log("candidateOn");
            sendMessage('slave',{
                type:'candidate',
                label: e.candidate.sdpMLineIndex,
                id: e.candidate.sdpMid,
                candidate: e.candidate.candidate
            })
        }
    }
    if(localStream){
        localStream.getTracks().forEach((track)=>{
            pc.addTrack(track,localStream);
        })
    }
    socket.emit('slaveStart',slaveId);
}

function closePeerConnection(){
    if(pc){
        pc.close();
        pc=null;
    }
}


function closeLocal(){
    if(localStream&&localStream.getTracks()){
        localStream.getTracks().forEach((track)=>{
            track.stop();
        })
        localStream=null;
    }
}

function connectSignalServer(){
    initSocketIO();
}
function disconnectSignalServer(){
    if(socket){
        socket.emit('leave',roomId);
    }
}
function start(){
    if(state=='master'){
        if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("请使用新版浏览器");
            return;
        } else {
            let constraints = {
                video:true,
                audio: {
                    echoCancellation: true
                }
            }
            navigator.mediaDevices.getUserMedia(constraints).then(getMediaStream).catch(handleErr);
        }
    } else if(state=='slave'){
        slaveCreatePeerConnection();
        socket.emit('ready',roomId);
    }
}

conn_btn.onclick = connectSignalServer;
discon_btn.onclick = disconnectSignalServer;
