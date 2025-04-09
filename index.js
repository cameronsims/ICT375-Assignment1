/*
 *
 * server.js – This is where the server starts from.
 *
 */
"use strict";

// Import HTTP module
const http = require('http');

// Use URL module for cleaner code 
const url = require("url");

// Get the import JSON data.
const server = require("./server.json");

// Use router 
const router = require("./router.js");

// Used when we're dealing with getting...
const onGet = function(request, response) {
	// Get the route
	const parseURL = url.parse(request.url);
	
	/* We want to get all the request variables...
	let requestObject = {};
	for (const [key, val] of Object.entries(parseURL)) {
		// If there is only one argument...
		const prefix = key + "=";
		if (typeof(val) == typeof("") && val.startsWith(prefix)) {
			requestObject[key] = val.substring( prefix.length );
		}
	}*/
	router.route(parseURL.pathname, request, response);
};

// Used when we're dealing with posting..
const onPost = function(request, response) {
	// Get the route
	const parseURL = url.parse(request.url);
	router.route(parseURL.pathname, request, response);
};

// Define callback function with parameters
const onRequest = function(request, response) {
	// If we are dealing with POST use POST function 
	// If we're dealing with GET use GET function
	const method = (request.method == "POST") ? onPost : onGet;
	method(request, response);
}

// Create server
let httpServer = http.createServer(onRequest);
httpServer.listen(server.port);

// Show on screen 
console.log(`Server running at \"http://${server.url}:${server.port}\"`);
console.log(`Process ID: ${process.pid}`);