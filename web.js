/***************************************/
/***             REQUIRE             ***/
/***************************************/

var mqtt = require('mqtt')
  , http = require('http')
  , mongo = require('mongojs')
  , server = http.createServer(function(req,res) {
    // res.write('test');
    // res.end();
    console.log(req.url);
    var url_array = req.url.substr(1,req.url.length).split('/');
    console.log(url_array);

    // root route
    if(url_array.length == 1 && url_array == '') {
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
    // register the cups into the DB
    } else if(url_array[0] == 'register_cup') {
      db.cups.save({
        id: Number(url_array[1]),
        table_id: Number(url_array[1]) + 3,
        empty: false,
        drink: (Number(url_array[1]) == 1 ? 'Dr. Pepper' : 'Pepsi'),
        assigned: null
      }, function(err, saved) {
        if(err || !saved) {
          console.log("Cup not saved");
          console.log(err)
        }
        else {
          console.log("Cup saved");
          console.log(saved);
        }
      });
    }
  })
  , io = require('socket.io').listen(server)
  , fs = require("fs")
  , UA = require("urban-airship")
  , ua = new UA("LXiU5zf5T828zvehhEYztw", "LyuvmcX7T-KJWWH7ubtTkA", "1SqY61axQPGpA2-awcJpsw")
  ;

/***************************************/
/***            CONFIGURE            ***/
/***************************************/

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 1);
});

// set the port
var port = process.env.PORT || 3000;

/***************************************/
/***           MQTT SERVER           ***/
/***************************************/

mqtt_client = mqtt.createClient(1883, 'att-q.m2m.io', {
  protocolVersion: 3,
  username: 'robinjoseph08@sbcglobal.net',
  password: 'c763a1f9b7833418b277d1d01b482438',
  clientId: 'realservice1'
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
/***              MONGO              ***/
/***************************************/

// configure the database URL
var databaseUrl = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'attm2mhack';

// establish the mongo tables
var collections = ['cups'];
// connect to the mongo DB
var db = mongo.connect(databaseUrl, collections);

/***************************************/
/***             LISTEN              ***/
/***************************************/

server.listen(port,function() {
  console.log('HTTP now listening on port ' + port + '.');
});

/***************************************/
/***            SOCKET.IO            ***/
/***************************************/

io.sockets.on('connection', function(socket) {
  console.log('socket connected');

  mqtt_client.on('message',function(topic,message,packet) {
    var cup_id = topic.substr(topic.length-1,1);
    var message_json = JSON.parse(message);
    console.log(cup_id);
    console.log(message_json);
    if(message_json.cup_id) {
      db.cups.findOne({id:message_json.cup_id},function(err,cup) {
        if(err) {
          console.log('db find err');
          console.log(err);
        } else {
          console.log('db find success');
          if(!cup.empty) {
            db.cups.findAndModify({
              query: { id: cup.id },
              update: { $set: { empty:true } }
            }, function(err, new_cup) {
              if(err) {
                console.log('db update error');
                console.log(err);
              } else {
                console.log('db update success');
                var payload1 = {
                  "aps": {
                    "badge": 1,
                    "alert": "Refill Table " + new_cup.table_id + ' with ' + new_cup.drink + '.',
                    "sound": "ding"
                  }
                };
                ua.pushNotification("/api/push/broadcast/", payload1, function(error) {
                  if(error) {
                    console.log('ua broadcast error');
                    console.log(error);
                  } else {
                    console.log('ua broadcast success');
                  }
                });
                socket.emit('refill',{
                  table_id: new_cup.table_id,
                  drink: new_cup.drink
                });
              }
            });
          }
        }
      });
    } else if(message_json.filled) {
      db.cups.findOne({id:message_json.filled},function(err,cup) {
        if(err) {
          console.log('db find err');
          console.log(err);
        } else {
          console.log('db find success');
          if(cup.empty) {
            db.cups.findAndModify({
              query: { id: cup.id },
              update: { $set: { empty:false } }
            }, function(err, new_cup) {
              if(err) {
                console.log('db update error');
                console.log(err);
              } else {
                console.log('db update success');
                socket.emit('filled',{
                  table_id: new_cup.table_id
                });
              }
            });
          }
        }
      });
    }
  });

  socket.on('token',function(data) {
    console.log('token');
    console.log(data.token);
    ua.registerDevice(data.token,function(err){
      if(err) {
        console.log('ua error');
        console.log(err);
      } else {
        console.log('ua success');
      }
    });
  });

  socket.on('req_queue',function(data) {
    console.log('requested queue');
    db.cups.find({empty:true},function(err,cups) {
      if(err) {
        console.log('db err');
        console.log(err);
      } else {
        socket.emit('queue',{queue: cups});
      }
    });
  });

  socket.on('assign',function(data) {
    console.log('assign');
    console.log(data);
  });
});
