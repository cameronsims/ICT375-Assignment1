/*
 *
 * router.js – This is how we route the handlers
 *
 */
"use strict";

const handler = require("./requestHandlers.js");

const router_route = function(pathname, request, response) { 
	// Handle it...
	const handle = handler[pathname];
	if (!handle) {
		handler["/notfound"](request, response);
		return;
	}
	
	// Request using the handler
	handle(request, response);
	
}

exports.route = router_route