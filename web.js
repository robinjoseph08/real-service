/***************************************/
/***             REQUIRE             ***/
/***************************************/

var express = require('express')
	, engine = require('ejs-locals')
	, app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , mongo = require('mongojs');

/***************************************/
/***            CONFIGURE            ***/
/***************************************/

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  io.set('log level', 1);
});

app.configure(function(){
	// ejs
  app.set('view engine', 'ejs');
	// ejs-locals for templating
	app.engine('ejs', engine);
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  // app.use(express.cookieParser(process.env.SESSION_KEY || 'SECRETKEY'));
  // app.use(express.session({
  //   secret: process.env.SESSION_KEY || 'SECRETKEY'
  // }));
  app.use(app.router);
});

// set the port
var port = process.env.PORT || 3000;

/***************************************/
/***              ROUTE              ***/
/***************************************/

app.get('/', function (req, res) {
  console.log('GET /');
  res.render('index', {});
});

app.get('/test', function (req, res) {
  console.log('GET /test');
  res.send('This is a test call.');
});

/***************************************/
/***              LISTEN             ***/
/***************************************/

server.listen(port, function() {
	console.log('Listening on port ' + port);
});









