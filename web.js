// Load the TCP Library
net = require('net');

// Start a TCP Server
net.createServer(function (socket) {
  console.log('Connected');
}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000.");