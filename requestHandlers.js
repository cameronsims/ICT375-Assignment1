/*
 *
 * requestHandlers.js – This is how we handle requests
 *
 */
"use strict";

// Use URL module for cleaner code 
const url = require("url");

const formidable = require("formidable");
const fs = require("fs");
const server = require("./server.json");
const database = require("./database.js");

// Used to get all the query vars 
const handler_parseGET = function(request) {
	// Get list URL
	const parseURL = url.parse(request.url);
	
	// Get query string.
	const query = {};
	let qString = parseURL.query;
	if (qString == null || qString.length == 0) {
		qString = "query=";
	}
	const qTokens = qString.split('&');
	for (let i = 0 ; i < qTokens.length; i++) {
		const tokens = qTokens[i].split('=');
		const key = tokens[0];
		const val = tokens[1];
		query[key] = val;
	}
	return query;
}

// Used in the root 
const handler_root = function (request, response) {
	// Read and print to the response
	fs.readFile(server.html.root, function(err, data) {
		// Don't even attempt 
		if (err) {
			console.log(err);
			return;
		}
		
		// If we have an error, don't do anything.
		response.writeHead(200, { 
			"Content-Type": "text/html" 
		});
		
		// Respond
		response.write(data);
		response.end();
	});
};

// Used when we want to find something.
const handler_find = function (request, response) {
	// On Error 
	const onFail = function(err) {
		response.writeHead(404, { "Content-Type": "application/json" });
		response.write("[]");
		response.end();
	};
	
	// On Success 
	const onSuccess = function(matches) {
		if (matches.length == 0) {
			response.writeHead(404, { "Content-Type": "application/json" });
			response.write("[]");
			response.end();
			return;
		}
		
		// Get the table data...
		let studentList = "[";
		for (let i = 0; i < matches.length; i++) {
			let student = matches[i];
			student["photo"] = null;
			const dir = "./photos/";
			const sID = student["id"];
			
			if ( fs.existsSync( dir + sID + ".png" ) ) {
				student["photo"] = sID + ".png";
			} else if ( fs.existsSync( dir + sID + ".jpg" ) ) {
				student["photo"] = sID + ".jpg";
			} else if ( fs.existsSync( dir + sID + ".jpeg" ) ) {
				student["photo"] = sID + ".jpeg";
			}
			
			const studentStr = JSON.stringify(student);
			const commaSuffix =  (i < matches.length - 1) ? "," : "";
			studentList += ( studentStr + commaSuffix );
		}
		
		studentList += "]"
		response.writeHead(200, { "Content-Type": "application/json" });
		response.write(studentList);
		response.end();
	};
	
	// Get query 
	const GET = handler_parseGET(request);
	const query = GET["query"];
	
	// Find everything.
	database.find(query, onFail, onSuccess);
};

// Used to check if the fields are valid 
const handler_submitValidate = function (fields, files) {
	try {
		const sID = fields.studentID[0];
		const sFN = fields.studentFName[0];
		const sLN = fields.studentLName[0];
		const sAge = fields.studentAge[0];
		const sGender = fields.studentGender[0];
		const sDegree = fields.studentDegree[0];
		const sPFP = files.studentPFP[0];

		// Check if the ID isn't full numbers. 
		const IDRegex = new RegExp(/^[0-9]+$/);
		if (!IDRegex.test(sID)) {
			return false;
		}
		
		// Check if the name is over one char
		if (!sFN || !sLN || sFN.length == 0 || sLN.length == 0) {
			return false;
		}
		
		// Check if the age is a number, and over 0
		const ageRegex = new RegExp(/^[0-9]+$/);
		if (!ageRegex.test(sAge)) {
			return false;
		}
		const intAge = 1*sAge;
		if (intAge < 0) {
			return false;
		}
		
		// Make sure gender is Male, Female or Other 
		if (sGender != "Male" && sGender != "Female" && sGender != "Other") {
			return false;
		}
		
		// Make sure degree is a string 
		if (!sDegree || sDegree.length == 0) {
			return false;
		}
		
		// Check extension exists / is PNG/JPG/JPEG
		const fileTokens = sPFP.originalFilename.toLowerCase().split('.');
		if (fileTokens.length == 1) {
			return false;
		}
			
		// Get extension
		const fileExt = fileTokens[ fileTokens.length - 1 ];
		if (fileExt != "png" && fileExt != "jpg" && fileExt != "jpeg") {
			return false;
		}
		
		return true;
	} catch (e) {
		return false;
	}
};

// Used when we submit a request
const handler_submit = function (request, response) {	
	const onFail = function (err) {
		// Respond
		console.log(err);
		response.writeHead(400, { 
			"Content-Type": "application/json" 
		});
		response.write("{}");
		response.end();
	};
	const onSuccess = function (fields) {
		// Respond 
		response.writeHead(201, { 
			"Content-Type": "application/json" 
		});
		
		response.write( JSON.stringify( fields ) );
		response.end();
	};
	
	let form = new formidable.IncomingForm({ "keepExtensions": true });
	form.parse(request, function (err, fields, files) {
		// Do on fail.
		if (err) {
			onFail(err);
			return;
		}
		
		// Perform form validation here.
		if (!handler_submitValidate(fields, files)) {
			onFail(null);
			return;
		}
		
		// Set the name of the new file to the ID 
		const file = files.studentPFP[0];
		const fileTokens = file.originalFilename.split('.');
		
		// Get extension
		const fileExt = fileTokens[ fileTokens.length - 1 ];
		
		// Create new file...
		const newPath = "./photos/" + fields.studentID + "." + fileExt;
		
		// Copy the damn file, fuck the world!
		fs.copyFile(file.filepath, newPath, function (err) {
			// We failed!
			if (err) {
				onFail(409);
				return;
			}
			
			// Put data into the DB.
			database.insert( fields.studentID[0], fields.studentFName[0], fields.studentLName[0], 
							 fields.studentAge[0], fields.studentGender[0], fields.studentDegree[0], 
							 null,
							 onFail, function() { onSuccess(fields); } );
							 
			// REFRESH OUR PHOTOS DIRECTORY 
			handler_readStaticPath("photos");
		});
	});
};

// Used when we don't know where a resource is
const handler_notfound = function (request, response) {
	// Read and print to the response
	fs.readFile(server.html.notfound, function(err, data) {
		// Don't even attempt 
		if (err) {
			console.log(err);
			return;
		}
		
		// If we have an error, don't do anything.
		response.writeHead(404, { 
			"Content-Type": "application/html" 
		});
		
		// Respond
		response.write(data);
		response.end();
	});
};

// Get the type of the file
const handler_staticContentType = function (fname) {
	// Get extension 
	const ftokens = fname.split(".");
	if (ftokens.length < 2) {
		return "text/plain";
	}
	
	const fext = ftokens[ ftokens.length - 1 ].toLowerCase();
	
	const extensions = {
		"css": "text/css",
		"js": "application/javascript",
		"jpg": "image/jpeg",
		"jpeg": "image/jpeg",
		"png": "image/png",
		"json": "application/json"
	};
	
	if (!extensions[fext]) {
		return "text/plain";
	}
	
	return extensions[fext];
	
}

// Give it statically.
const handler_static = function(request, response) {
	// Read and print to the response
	fs.readFile(process.cwd() + "/" + request.url, function(err, data) {
		// Don't even attempt 
		if (err) {
			console.log(err);
			return;
		}
		
		// If we have an error, don't do anything.
		response.writeHead(200, { 
			"Content-Type": handler_staticContentType(request.url)
		});
		
		// Respond
		response.write(data);
		response.end();
	});
};

// Read all static...
const handler_readStaticPath = function(path) {
	fs.readdir(`${path}`, function(err, files) {
		if (err) {
			console.log(`Cannot read directory ${path}.`);
			return;
		}
		
		for (let i = 0; i < files.length; i++) {
			exports[`/${path}/` + files[i]] = handler_static;
		}
	});
};

exports["/"] = handler_root;
exports["/find"] = handler_find;
exports["/submit"] = handler_submit;
exports["/notfound"] = handler_notfound;

// Add static imports...
handler_readStaticPath("js");
handler_readStaticPath("css");
handler_readStaticPath("photos");

