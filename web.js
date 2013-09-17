/***************************************/
/***             REQUIRE             ***/
/***************************************/

var db = {
    cups: [{
      id: 1,
      table_id: 4,
      empty: false,
      drink: 'Dr. Pepper',
      assigned: null
    },{
      id: 2,
      table_id: 3,
      empty: false,
      drink: 'Pepsi',
      assigned: null
    }]
  }
  , mqtt = require('mqtt')
  , http = require('http')
  , server = http.createServer(function(req,res) {
    // res.write('test');
    // res.end();

    fs.readFile('index.html', function(err, html) {
      if(err) {
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }

      res.writeHead(200, {"Content-Type": "text/html"});
      res.write(html);
      res.end();
    });
  })
  , io = require('socket.io').listen(server)
  , fs = require("fs")
  , UA = require("urban-airship")
  , ua = new UA("LXiU5zf5T828zvehhEYztw", "LyuvmcX7T-KJWWH7ubtTkA", "1SqY61axQPGpA2-awcJpsw")
  ;

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 1);
});

/***************************************/
/***           MQTT SERVER           ***/
/***************************************/

mqtt_client = mqtt.createClient(1883, 'att-q.m2m.io', {
  protocolVersion: 3,
  username: 'robinjoseph08@sbcglobal.net',
  password: 'c763a1f9b7833418b277d1d01b482438',
  clientId: 'realservice'
});

mqtt_client.on('connect',function(data) {
  console.log('mqtt client connected');
});

mqtt_client.subscribe('b4b862f7ad6aef376c25e792ffaa914b/arduino/#', {qos: 0}, function() {});

// mqtt_server = mqtt.createServer(function(socket) {
//   console.log('in net_server');
//   socket.on('data',function(data) {
//     var data_str = '' + data;
//     console.log('in net_server data');
//     console.log(data_str);
//     if(data_str.indexOf('token=') != -1) {
//       client_socket = socket;
//       token = data_str.substring(data_str.indexOf('='),data_str.length);
//       ua.registerDevice(token,function(err){});
//     } else if(data_str.indexOf('{') != -1) {
//       var cup_json = JSON.parse(data_str.substring(data_str.indexOf('{'),data_str.length));
//       console.log(cup_json);
//       if(cup_json.cup_id && !db.cups[cup_json.cup_id-1].empty) {
//         db.cups[cup_json.cup_id-1].empty = true;
//         console.log('Cup ' + cup_json.cup_id + ' is empty.');
//         // send notification to iOS
//         // socket.emit('refill', {table_id: db.cups[cup_json.cup_id-1].table_id});
//         if(client_socket) {
//           client_socket.write('refill,' + db.cups[cup_json.cup_id-1].table_id + ',' + db.cups[cup_json.cup_id-1].drink + '\r\n');
//           var payload1 = {
//             "aps": {
//               "badge": 1,
//               "alert": "Refill Table " + db.cups[cup_json.cup_id-1].table_id + ' with ' + db.cups[cup_json.cup_id-1].drink,
//               "sound": "ding"
//             }
//           };
//           ua.pushNotification("/api/push/broadcast/", payload1, function(error) {console.log(error)});
//         }
//       } else if(cup_json.filled && db.cups[cup_json.filled-1].empty) {
//         db.cups[cup_json.filled-1].empty = false;
//         db.cups[cup_json.filled-1].assigned = null;
//         console.log('Cup ' + cup_json.filled + ' is filled.');
//         // send notification to iOS
//         if(client_socket) {
//           client_socket.write('filled,' + db.cups[cup_json.filled-1].table_id + '\r\n');
//         }
//       }
//     }
//   });
//   socket.on('close',function() {
//     console.log('socket closed');
//     client_socket = null;
//   });
// });

/***************************************/
/***             LISTEN              ***/
/***************************************/

server.listen(5000,function() {
  console.log('HTTP now listening on port 5000.');
});

/***************************************/
/***            SOCKET.IO            ***/
/***************************************/

io.sockets.on('connection', function(socket) {
  console.log('socket connected');

  mqtt_client.on('message',function(topic,message,packet) {
    var cup_id = topic.substr(topic.length-1,1);
    console.log(cup_id);
    console.log(JSON.parse(message));
    socket.emit('test',JSON.parse(message));
  });
});
