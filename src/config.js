'use strict';

var fs = require('fs');

var config = module.exports = require(__dirname+'/../etc/config.json');

var local_config = {};
if(fs.existsSync(__dirname+'/../etc/local.json')) {
	local_config = require(__dirname+'/../etc/local.json');
	Object.keys(local_config).forEach(function(key) {
		config[key] = local_config[key];
	});
}

var env_config = {};
if(process.env.NOPG_SERVER_CONFIG) {
	env_config = JSON.parse(process.env.NOPG_SERVER_CONFIG);
	Object.keys(env_config).forEach(function(key) {
		config[key] = env_config[key];
	});
}

if(!config.site_url) {
	config.site_url = "http://localhost";
}

if(config.facebook && (!config.facebook.callback_url)) {
	config.facebook.callback_url = config.site_url + "/api/auth/facebook/callback";
}

if(config.twitter && (!config.twitter.callback_url)) {
	config.twitter.callback_url = config.site_url + "/api/auth/twitter/callback";
}

if(config.github && (!config.github.callback_url)) {
	config.github.callback_url = config.site_url + "/api/auth/github/callback";
}

if(!config.success_redirect) {
	config.success_redirect = '/';
}

if(!config.failure_redirect) {
	config.failure_redirect = '/login';
}
