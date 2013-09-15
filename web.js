/***************************************/
/***             REQUIRE             ***/
/***************************************/

var net = require('net')
  , db = {
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
  // , app = express()
  // , http = require('http')
  // , http_server = http.createServer(app)
  , UA = require("urban-airship")
  , ua = new UA("LXiU5zf5T828zvehhEYztw", "LyuvmcX7T-KJWWH7ubtTkA", "1SqY61axQPGpA2-awcJpsw")
  , client_socket
  , token
  ;

/***************************************/
/***           TCP SERVER            ***/
/***************************************/

net_server = net.createServer(function(socket) {
  console.log('in net_server');
  socket.write('butt\r\n');
  socket.on('data',function(data) {
    var data_str = '' + data;
    console.log('in net_server data');
    console.log(data_str);
    if(data_str.indexOf('token=') != -1) {
      client_socket = socket;
      token = data_str.substring(data_str.indexOf('='),data_str.length);
      ua.registerDevice(token,function(err){});
    } else if(data_str.indexOf('{') != -1) {
      var cup_json = JSON.parse(data_str.substring(data_str.indexOf('{'),data_str.length));
      console.log(cup_json);
      if(cup_json.cup_id && !db.cups[cup_json.cup_id-1].empty) {
        db.cups[cup_json.cup_id-1].empty = true;
        console.log('Cup ' + cup_json.cup_id + ' is empty.');
        // send notification to iOS
        // socket.emit('refill', {table_id: db.cups[cup_json.cup_id-1].table_id});
        if(client_socket) {
          client_socket.write('refill,' + db.cups[cup_json.cup_id-1].table_id + ',' + db.cups[cup_json.cup_id-1].drink + '\r\n');
          var payload1 = {
            "aps": {
              "badge": 1,
              "alert": "Refill Table " + db.cups[cup_json.cup_id-1].table_id + ' with ' + db.cups[cup_json.cup_id-1].drink,
              "sound": "ding"
            }
          };
          ua.pushNotification("/api/push/broadcast/", payload1, function(error) {console.log(error)});
        }
      } else if(cup_json.filled && db.cups[cup_json.filled-1].empty) {
        db.cups[cup_json.filled-1].empty = false;
        db.cups[cup_json.filled-1].assigned = null;
        console.log('Cup ' + cup_json.filled + ' is filled.');
        // send notification to iOS
        if(client_socket) {
          client_socket.write('filled,' + db.cups[cup_json.filled-1].table_id + '\r\n');
        }
      }
    }
  });
  socket.on('close',function() {
    console.log('socket closed');
    client_socket = null;
  });
});

var io = require('socket.io').listen(net_server)

/***************************************/
/***             LISTEN              ***/
/***************************************/

net_server.listen(5000,function() {
  console.log('TCP now listening on port 5000.');
});

/***************************************/
/***            SOCKET.IO            ***/
/***************************************/

/*io.sockets.on('connection', function(socket) {
  console.log('socket connected');
  socket.on('assign',function(data) {
    console.log('socket assign');
    var assign_json = JSON.parse('' + data);
    if(db.cups[assign_json.cup_id-1].empty) {
      db.cups[assign_json.cup_id-1].assigned = assign_json.name;
    }
  });
});*/
