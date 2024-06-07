const express = require('express');
const app = express();
const cors =require('cors');
const socket = require('socket.io');
const moment =require('moment');

app.use(cors({
    origin:"*"
}));

//https://groupvideocall-8m4w.onrender.com/

const server = app.listen(3000,()=>{
    console.log("server is running");
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'ejs');
app.set('views','/views');

app.use(express.static('public'));

const userRoutes = require('./routes/userRoute');
const { connect } = require('http2');

app.use('/',userRoutes);

const io = socket(server);
//socket io work

var userConnection =[];

io.on("connection",(socket)=>{

    socket.on("users_info_to_signaling_server" , (data)=>{
        var other_users = userConnection.filter(p=> p.meeting_id == data.meeting_id);
        userConnection.push({
            connectionId:socket.id,
            user_id: data.current_user_name,
            meeting_id: data.meeting_id
        });
        console.log(`all user ${userConnection.map(a => a.connectionId)}`);
        console.log(`other users ${other_users.map(a=>a.connectionId)}`);

        other_users.forEach(v=>{
            socket.to(v.connectionId).emit('other_users_to_inform',{
                other_users_id: data.current_user_name,
                connId: socket.id
            });
        });
        socket.emit("newConnectionInformation" , other_users);
    });

    socket.on('sdpProcess',(data)=> {
        socket.to(data.to_connid).emit('sdpProcess',{
            message: data.message,
            from_connid: socket.id
        });
    });

    socket.on('chatmessage', (data) => {
        var usersInMeeting = userConnection.filter(u => u.meeting_id === data.meeting_id);
        usersInMeeting.forEach(user => {
            io.to(user.connectionId).emit('chatmessage', formatMessage(data.username, data.messageInput));
        });
    });

    function formatMessage(username, text) {
        return {
          username,
          text,
          time: moment().format('h:mm a')
        };
      }
    
    socket.on('disconnect',function(){
        var disUser = userConnection.find(p=>p.connectionId == socket.id);
        if(disUser){
            var meeting_id = disUser.meeting_id;
            userConnection = userConnection.filter(p=>p.connectionId != socket.id);
            var restUser = userConnection.filter(p=>p.meeting_id == meeting_id);
            restUser.forEach(n=> {
                socket.to(n.connectionId).emit('closedConnectionInfo',socket.id);
            });
        }
    });
});




