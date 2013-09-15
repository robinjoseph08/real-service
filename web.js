/***************************************/
/***             REQUIRE             ***/
/***************************************/

var net = require('net')
  , mongo = require('mongojs')
  , db = {
    cups: [{
      id: 1,
      table_id: 4,
      empty: false,
      drink: 'Dr. Pepper',
      assigned: null
    }]
  }
  , express = require('express')
  , app = express()
  , http = require('http')
  , http_server = http.createServer(app)
  , io = require('socket.io').listen(http_server)
  ;

/***************************************/
/***           TCP SERVER            ***/
/***************************************/

net_server = net.createServer(function(socket) {
  socket.on('data',function(data) {
    var data_str = '' + data;
    if(data_str.indexOf('{') != -1) {
      var cup_json = JSON.parse(data_str.substring(data_str.indexOf('{'),data_str.length));
      console.log(cup_json);
      if(!db.cups[cup_json.cup_id].empty) {
        db.cups[cup_json.cup_id].empty = true;
        // send notification to iOS
        // socket.emit('refill', {table_id: db.cups[cup_json.cup_id].table_id});
      }
    }
  });
});

/***************************************/
/***             ROUTES              ***/
/***************************************/

app.get('/',function(req,res) {
  console.log('GET /');
  res.send('YAY HTTP!');
});

/***************************************/
/***             LISTEN              ***/
/***************************************/

net_server.listen(5000,function() {
  console.log('TCP now listening on port 5000.');
});

http_server.listen(3000,function() {
  console.log('HTTP now listening on port 3000.');
});


/***************************************/
/***            SOCKET.IO            ***/
/***************************************/

io.sockets.on('connection', function(socket) {
  socket.on('assign',function(data) {
    var assign_json = JSON.parse('' + data);
    if(db.cups[assign_json.cup_id-1].empty) {
      db.cups[assign_json.cup_id-1].assigned = assign_json.name;
    }
  });

  socket.on('clear',function(data) {
    var clear_id = Number(data);
    if(db.cups[clear_id-1].empty) {
      db.cups[clear_id-1].empty = false;
      db.cups[clear_id-1].assigned = null;
    }
  });
});
