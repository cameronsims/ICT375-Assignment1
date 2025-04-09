// Check if value is valid
const form_isFieldValid = function(field) {
	if (!field) {
		return false;
	}
	
	const value = $(field).val();
	return (value != "" && value != null);
};

// Check if form is valid 
const form_isValid = function (form) {
	
	// Get the things we need to validate.
	return (form_isFieldValid($("#studentID")) &&
	        form_isFieldValid($("#studentFName")) &&
	        form_isFieldValid($("#studentLName")) &&
	        form_isFieldValid($("#studentAge")) &&
	        form_isFieldValid($("#studentGender")) &&
	        form_isFieldValid($("#studentDegree")));
	
};

// When form is valid
const form_onValid = function (f, response) {
	// We expect a JSON. If it is empty...
	console.log(response);
	let errElem = $(document.createElement("p"));
	errElem.addClass("success");
	errElem.text(`Succuessfully created student record (${response.studentFName} ${response.studentLName})!`);
	
	$(f).empty().append(errElem);
};

// Used when form is not valid 
const form_onInvalid = function (f, message) {
	// If we're ever invalid.
	let errElem = $(document.createElement("p"));
	errElem.addClass("error");
	errElem.text(message); 
	
	$(f).empty().append(errElem);
};

// Used to parse the results 
const form_onResult = function(f, response) {
	
	// Get the bin.
	let table = $(f);
	table.empty();
	
	// Create a fragment 
	let frag = $( document.createDocumentFragment() );
	
	// Header Titles 
	const TITLES = {
		"Photo": "photo",
		"ID": "id",
		"First Name": "fname",
		"Last Name": "lname",
		"Age": "age",
		"Gender": "gender",
		"Degree": "degree"
	};
	
	// Create header
	const KEYS = Object.keys(TITLES);
	let tableHeader = $(document.createElement("tr"));
	for (let i = 0; i < KEYS.length; i++) {
		let tableHeaderElem = $( document.createElement("th") );
		tableHeaderElem.text(KEYS[i]);
		tableHeader.append(tableHeaderElem);
	}
	frag.append(tableHeader);
	
	for (let i = 0; i < response.length; i++) {
		const result = response[i];
		let row = $( document.createElement("tr") );
		
		for (let j = 0; j < KEYS.length; j++) {
			let data = $( document.createElement("td") );
			const KEY = TITLES[KEYS[j]];
			if (KEY == "photo") {
				let img = $( document.createElement("img") );
				img.attr("src", "./photos/" + result[KEY]);
				img.width("width", "100%");
				data.append(img);
			} else {
				data.text( result[KEY] );
			}
			row.append(data);
		}
		
		frag.append(row);
	}
	
	console.log("DONE");
	table.append(frag);
};

// Used to test if we're going to test form validation for inputting new students 
const form_submitValidation = function(event) {
	// Get the form we're addressing...
	let fElem = document.getElementById("submit");
	
	// prevent from redirect
	event.preventDefault();
	
	// Check if the form is valid 
	if (!form_isValid(fElem)) {
		form_onInvalid("#submit-errorbin", "Error: Invalid Form Input!");
		return false;
	}
	
	// We want to serialise it to prevent "+" from replacing space.
	let f = $(fElem);
	
	$.ajax({
		url: f.attr("action"),
		type: f.attr("method"),
		data: new FormData( fElem ),
		processData: false,
		contentType: false,
		success: function (response) { 
			form_onValid("#submit-errorbin", response);
		},
		error: function(xhr, status, error) { 
			form_onInvalid("#submit-errorbin", "Error: ID already taken!");
		}
	});
	
	return false;
};

// Used to get current students using query 
const form_requestValidation = function(event) {
	// Get the form we're addressing
	let fElem = document.getElementById("find");
	event.preventDefault();
	
	const tableName = "#request-results";
	const f = $(fElem);
	
	$.ajax({
		url: f.attr("action") + "?query=" + $("#query").val(),
		type: f.attr("method"),
		data: new FormData( fElem ),
		processData: false,
		contentType: false,
		success: function (response) { 
			form_onResult(tableName, response);
		},
		error: function(xhr, status, error) { 
			console.log(xhr.responseText);
			$(tableName).empty();
		}
	});
	
	return false;
};

// Run when the document loads.
$(document).ready(function() {
	// Get both our forms to prepare. 
	
	// This is our submit form
	 $("#submit").submit( form_submitValidation );
	 $("#find").submit( form_requestValidation );
});