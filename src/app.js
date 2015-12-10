'use strict';

var _Q = require('q');
_Q.longStackSupport = true;
var debug = require('nor-debug');
var config = require('./config.js');
var express = require('express');
var nopg = require('nor-nopg');
var nor_express = require('nor-express');
var NoPgStore = require('nor-nopg-store');
var partials = require('express-partials');
var RoutesJSON = require('nor-routes-json');
var ref = require('nor-ref');
var io = require('socket.io').listen(server);

var app = express();

var routes_file = PATH.resolve(__dirname, 'spec/routes.json');

app.configure(function() {

	if(config.session && config.database) {
		config.session.store = new NoPgStore({"pg": config.database});
	}

	var routes = nor_express.routes.load(__dirname+'/routes');

	app.set('port', process.env.PORT || config.port || 3000);
	app.set('views', PATH.resolve(__dirname, 'views'));
	app.set('view engine', 'ejs');
	app.set('trust proxy', true);

	if(config.cookie && config.cookie.secret) {
		app.use(express.cookieParser(config.cookie.secret));
	}

	if(config.session) {
		app.use(express.session(config.session));
	}

	app.use(nor_express.plugins.request_id());
	app.use(nor_express.plugins.multimedia_redirect());
	app.use(express.favicon( PATH.resolve(__dirname, 'browser/img/favicon.ico')));
	app.use(express.urlencoded());
	app.use(express.json());
	app.use(express.methodOverride());

	/* Setup app as `req.app` if not already */
	app.use(function(req, res, next){
		if(req.app === undefined) {
			req.app = app;
		}
		if(req.locals === undefined) {
			req.locals = {};
		}
		next();
	});

	app.locals.app = app;

	app.use(partials());
	app.use(app.router);
	app.param( nor_express.params.regexps() );
	app.param('lang', /^[a-zA-Z0-9_\-]+$/);
	app.param('label', /^[a-zA-Z0-9_\-]+$/);
	app.param('uuid', /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/);
	app.param('uuid2', /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/);
	app.param('uuid3', /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/);
	app.param('uuid4', /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/);

	// Setup routes automatically
	nor_express.routes.setup(app, routes, '/', {
		'sender': nor_express.senders.standard()
	});

	// Load `routes.json`, update it, and save it. (Only if we're running in the development mode.)
	if(debug.isDevelopment()) {
		RoutesJSON.load(routes_file).update(app).save();
	}

	app.use('/browser', express.static(__dirname + '/browser'));

	app.use( nor_express.error_handlers.debuglog({next:true}) );
	app.use( nor_express.error_handlers.standard() );
	if(config.sentry) { app.use(require('raven').middleware.express(config.sentry)); }
	app.use( nor_express.error_handlers.static({'error':'Internal Server Error', 'code':500} ) );

});

var server = app.listen(process.env.PORT || 3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});
