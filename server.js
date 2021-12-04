'use strict'
var http=require('http');
var express=require('express');
var serveIndex=require('serve-index');
var fs=require('fs');
var app=express();
var socketio = require('socket.io');
app.use(serveIndex('./public'));
app.use(express.static('./public'));

let sslOptions={
    key:fs.readFileSync(__dirname + '/privkey.key'),
    cert:fs.readFileSync(__dirname + '/cacert.pem')
};
var server=http.createServer(app);
const https_server = require('https').createServer(sslOptions, app);
https_server.listen(443,'0.0.0.0');
server.listen(8880,'0.0.0.0');
let io = socketio(https_server);
var masterId = null;
var slaveId;
var masterMap = new Map();
app.get('/getRooms',function  (req,res,next) {
    let roomObject = io.sockets.adapter.rooms;
    let response_data = [];
    for(let name in roomObject){
        console.log(roomObject);
        if(roomObject[name].sockets[name]==undefined) response_data.push(
                {
                    id : name,
                    name : `第${name}号房间`,
                    roomCandidates : roomObject[name].length
                }
            );
    }
    res.type('application/json');
    res.jsonp(response_data);
});
io.sockets.on('connection',(socket)=>{
    socket.on('message',(id, message)=>{
        if(id=='master'){
            io.sockets.connected[masterId].emit('message',socket.id,message);
        } else if(id=='slave'){
            io.sockets.connected[slaveId].emit('message',socket.id,message);
        } else{
            io.sockets.connected[id].emit('message',socket.id,message);
        }
        //socket.to(room).emit('message',room,message);
    });
    socket.on('join',(room)=>{
        console.log('join'+socket.id);
        socket.join(room);
        let theRoom = io.sockets.adapter.rooms[room];
        let users = (theRoom)? Object.keys(theRoom.sockets).length : 0;
        let identity;
        if(users == 1) {
            identity = 'master';
            masterId=socket.id;
        } else {
            identity = 'slave';
            slaveId=socket.id;
        }
        socket.emit('identify', identity, socket.id);
    })
    socket.on('ready',(room)=>{
        io.sockets.connected[masterId].emit('newSlave',socket.id);
    })
    socket.on('slaveStart',(id)=>{
        console.log("slaveStart");
        console.log(id);
        console.log(masterId);
        io.sockets.connected[id].emit('masterId',masterId);
    })
    socket.on('leave',(room)=>{
        let theRoom = io.sockets.adapter.rooms[room];
        let users = (theRoom) ? Object.keys(theRoom.sockets).length : 0;
        console.log("leave");
        socket.to(room).emit('leaved',room,socket.id);
    })
})