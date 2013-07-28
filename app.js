var app_port = 8000;
var io_port = 3333;
var express = require('express');
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


var os = require('os');


var redis = require("redis");
var redis_client = redis.createClient();

var hbs = require('hbs');


app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.bodyParser());
app.use(express.static('public'));

var current_users = [];

redis_client.get("wifi_users", function(err, reply){
	if(reply != 'nil'){
		current_users = JSON.parse(reply);
	}
});

app.get('/', function(req, res){
	console.log(req.connection.remoteAddress);
	res.render('index', {users : current_users});
});

app.get('/admin', function(req, res){
   res.render('admin', {users : current_users});
});

app.post('/create_user', function(req, res){

	var id = current_users.length + 1;
	var username = req.param('username');
	var mac_address = req.param('mac_address');
	var ip_address = req.param('ip_address');

	current_users.push(
		{
		'id' : id,
		'name' : username, 
		'status' : 'browsing', 
		'mac_address' : mac_address,
		'ip_address' : ip_address,
		'btn_class' : 'btn-primary'
		}
	);

	redis_client.set("wifi_users", JSON.stringify(current_users));

	res.send({'status' : 'ok'});
});

app.post('/toggle_status', function(req, res){

	var id = req.param('id');
	var current_status = req.param('current_status');
	var new_status = (current_status == 'downloading') ? 'browsing' : 'downloading';
	var new_btn_class = (current_status == 'downloading') ? 'btn-primary' : 'btn-danger';

	var current_user_count = current_users.length;

	for(var x = 0; x < current_user_count; x++){
		if(current_users[x]['id'] == id){
			current_users[x]['status'] = new_status;
			current_users[x]['btn_class'] = new_btn_class;
		}
	}

	redis_client.set("wifi_users", JSON.stringify(current_users));

	res.send({'new_status' : new_status, 'btn_class' : new_btn_class});
});

app.get('/get_users', function(req, res){

	redis_client.get("wifi_users", function(err, reply){
		res.send(JSON.parse(reply));
	});
});

app.get('/db', function(req, res){

	var users = [
		{'id' : 1, 'name' : 'wern', 'status' : 'browsing', 'mac_address' : '1C:65:9D:3B:1A:C3', 'ip_address' : '192.168.254.102', 'btn_class' : 'btn-primary'},
		{'id' : 2, 'name' : 'junel', 'status' : 'browsing', 'mac_address' : '20:16:D8:52:CA:D2', 'ip_address' : '192.168.254.106', 'btn_class' : 'btn-primary'},
		{'id' : 3, 'name' : 'jerome', 'status' : 'browsing', 'mac_address' : '4C:0F:6E:5C:D3:B2', 'ip_address' : '192.168.254.105', 'btn_class' : 'btn-primary'},
		{'id' : 4, 'name' : 'marvz', 'status' : 'browsing', 'mac_address' : '1C:4B:D6:2D:FC:55', 'ip_address' : '192.168.254.108', 'btn_class' : 'btn-primary'}
	];

	redis_client.set("wifi_users", JSON.stringify(users));
});

redis_client.on("error", function(err){
    console.log("Error " + err);
});


io.sockets.on('connection', function(socket){
  
  socket.on('toggle_status', function(data){
    io.sockets.emit('update_toggle', data);
    
  });
});



server.listen(8000);