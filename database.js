/*
 *
 * database.js – This is how we read from the files.
 *
 */
"use strict";

// Used to get the file(s)
const fs = require("fs");

// Get the import JSON data.
const server = require("./server.json");


// Sees if query string matches field 
const matchesField = function(query, field) {
	// If query or field is not valid 
	if (!query || !field) {
		return false;
	}
	
	// Might add some extra functioonality here.
	const left = query.toString().trim().toLowerCase();
	const right = field.toString().trim().toLowerCase()

	// We want to test if it contains it.
	if (right.includes(left)) {
		return true;
	}
	
	// If it is the same.
	return (left == right);
	
}

// Used to find matches in the database 
const find = function(query, onFail, onend) {
	// List of all matches we found 
	let matches = []
	
	// Read the students file
	fs.readFile(server.dbFile, function(err, data) {
		// If we have an error, don't do anything.
		if (err) {
			onFail(err);
			return;
		}
		
		// Get lines in file, do it slowly.
		let buffer = data.toString("utf8");
		const lines = buffer.split("\n");
		
		// For each line.
		for (let i = 0; i < lines.length; i++) {
			// Get the current line.
			const line = lines[i];
			
			// Split for tokens 
			const tokens = line.split(',');
			
			if (tokens.length != 6) {
				// Don't care about this iteration.
				continue;
			}
			
			// Name parts of the tokens
			const student = {
				"id": tokens[0],
				"fname": tokens[1],
				"lname": tokens[2],
				"age": tokens[3],
				"gender": tokens[4],
				"degree": tokens[5]
			};
			
			// Use the query string to find what is matches.
			for (let j = 0; j < tokens.length; j++) {
				if (matchesField(query, tokens[j])) {
					// Add it to the list.
					matches.push(student);
					
					// We already added it, doesn't matter anymore.
					break;
				}
			}
		}
		
		// End the query 
		onend(matches);
	});
};

// Used ot check if the ID is in the database. 
const exists = function (sID, onfail, onend) {
	// Read the students file
	fs.readFile(server.dbFile, "utf8", function(err, data) {
		// If we have an error, don't do anything.
		if (err) {
			onfail(err);
			return;
		}
		
		// Get lines in file, do it slowly.
		const lines = data.split("\n");
		
		// For each line.
		for (let i = 0; i < lines.length; i++) {
			// Get the current line.
			const line = lines[i];
			
			// Split for tokens 
			const tokens = line.split(',');
			
			// Name parts of the tokens
			const studentID = tokens[0];
			if (matchesField(sID, studentID)) {
				onend(true);
				return;
			}
		}
		
		// End the query 
		onend(false);
		return;
	});
}

// Used to insert data in the database.
const insert = function (sID, sFName, sLName, sAge, sGender, sDegree, sPFP, onFail, onSuccess) {
	// Check if the sID is real.
	exists(sID, function (err) {}, function(doesExist) {
		// If it exists, send an error to the user.
		if (doesExist) {
			onFail();
			return;
		}
		
		// Add to the file
		const line = sID + ',' + sFName + ',' + sLName + ',' + sAge + ',' + sGender + ',' + sDegree + "\n";
		fs.appendFile(server.dbFile, line, function(err) {});
		onSuccess();
	});
};

exports.exists = exists;
exports.find = find;
exports.insert = insert;
exports.matchesField = matchesField;