/*==============================================================================
 * (C) Copyright 2017 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for JohnBot2
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK 	Initial version 
 * 2017-12-29 JJK	Initial controls and WebSocket communication
 *============================================================================*/

// Global variables
var ws = null;

//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");


function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}
function setCheckbox(checkVal){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input type="checkbox" data-mini="true" '+checkedStr+' disabled="disabled">';
}
$(document).ajaxError(function(e, xhr, settings, exception) {
	console.log("ajax exception = "+exception);
	console.log("ajax exception xhr.responseText = "+xhr.responseText);
	$(".ajaxError").html("An Error has occurred (see console log)");
	$("#StatusDisplay").html("An Error has occurred (see console log)");
});


$(document).ready(function(){
	// Using addClear plug-in function to add a clear button on input text fields
	$(".resetval").addClear();

	$("#StartButton").click(function() {
		$.getJSON("start","",function(response){
			console.log("response.wsUrl = "+response.wsUrl);
			ws = new WebSocket(response.wsUrl);
			// event emmited when connected
			ws.onopen = function () {
				console.log('websocket is connected ...')
				// sending a send event to websocket server
				ws.send('This is the message being sent from the client browser')
				$("#StatusDisplay").html("Connected");
			}
			// event emmited when receiving message 
			ws.onmessage = function (messageEvent) {
				//var msg = JSON.parse(messageEvent.data);
				
				$("#TempatureDisplay").html(messageEvent.data);
			}
		});
	});

	// Respond to the Search button click (because I can't figure out how to combine it with input change)
	$(document).on("click","#SearchButton",function(){
        //$("#PropertyListDisplay tbody").html("");
		console.log("searchStr = "+$("#searchStr").val());
    	//$.getJSON("testcall","searchStr="+cleanStr($("#searchStr").val()),function(response){
		/*
		$.get("testcall","searchStr="+cleanStr($("#searchStr").val()),function(response){
				console.log("response from SERVER in client = "+response);
    		//displayPropertyList(hoaPropertyRecList);
		});
		*/
		ws.send($("#searchStr").val());
        event.stopPropagation();
    });

	$("#ForwardButton")
		.mouseup(function() {
			console.log("Mouse UP");
	  	})
	  	.mousedown(function() {
			console.log("Mouse DOWN");
	  	});
	
			$("#ex6").slider({
				reversed : true
			});
			$("#ex6").on("slide", function(slideEvt) {
			  $("#ex6SliderVal").text(slideEvt.value);
			  //console.log("slider value = "+slideEvt.value);
		  });


}); // $(document).ready(function(){


	
	var create_email = false;
	var final_transcript = '';
	var recognizing = false;
	var ignore_onend;
	var start_timestamp;
	if (!('webkitSpeechRecognition' in window)) {
	  upgrade();
	} else {
	  start_button.style.display = 'inline-block';
	  var recognition = new webkitSpeechRecognition();
	  recognition.continuous = true;
	  recognition.interimResults = true;
	
	  recognition.onstart = function() {
		recognizing = true;
		showInfo('info_speak_now');
		start_img.src = './img/mic-animate.gif';
	  };
	
	  recognition.onerror = function(event) {
		if (event.error == 'no-speech') {
		  start_img.src = './img/mic.gif';
		  showInfo('info_no_speech');
		  ignore_onend = true;
		}
		if (event.error == 'audio-capture') {
		  start_img.src = './img/mic.gif';
		  showInfo('info_no_microphone');
		  ignore_onend = true;
		}
		if (event.error == 'not-allowed') {
		  if (event.timeStamp - start_timestamp < 100) {
			showInfo('info_blocked');
		  } else {
			showInfo('info_denied');
		  }
		  ignore_onend = true;
		}
	  };
	
	  recognition.onend = function() {
		recognizing = false;
		if (ignore_onend) {
		  return;
		}
		start_img.src = './img/mic.gif';
		if (!final_transcript) {
		  showInfo('info_start');
		  return;
		}
		showInfo('');
		if (window.getSelection) {
		  window.getSelection().removeAllRanges();
		  var range = document.createRange();
		  range.selectNode(document.getElementById('final_span'));
		  window.getSelection().addRange(range);
		}
		if (create_email) {
		  create_email = false;
		  createEmail();
		}
	  };
	
	  recognition.onresult = function(event) {
		var interim_transcript = '';
		for (var i = event.resultIndex; i < event.results.length; ++i) {
		  if (event.results[i].isFinal) {
			final_transcript += event.results[i][0].transcript;
		  } else {
			interim_transcript += event.results[i][0].transcript;
		  }
		}
		final_transcript = capitalize(final_transcript);
		final_span.innerHTML = linebreak(final_transcript);
		interim_span.innerHTML = linebreak(interim_transcript);
		if (final_transcript || interim_transcript) {
		  showButtons('inline-block');
		}
	  };
	}
	
	function upgrade() {
	  start_button.style.visibility = 'hidden';
	  showInfo('info_upgrade');
	}
	
	var two_line = /\n\n/g;
	var one_line = /\n/g;
	function linebreak(s) {
	  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
	}
	
	var first_char = /\S/;
	function capitalize(s) {
	  return s.replace(first_char, function(m) { return m.toUpperCase(); });
	}
	
	function createEmail() {
	  var n = final_transcript.indexOf('\n');
	  if (n < 0 || n >= 80) {
		n = 40 + final_transcript.substring(40).indexOf(' ');
	  }
	  var subject = encodeURI(final_transcript.substring(0, n));
	  var body = encodeURI(final_transcript.substring(n + 1));
	  window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
	}
	
	function copyButton() {
	  if (recognizing) {
		recognizing = false;
		recognition.stop();
	  }
	  copy_button.style.display = 'none';
	  copy_info.style.display = 'inline-block';
	  showInfo('');
	}
	
	function emailButton() {
	  if (recognizing) {
		create_email = true;
		recognizing = false;
		recognition.stop();
	  } else {
		createEmail();
	  }
	  email_button.style.display = 'none';
	  email_info.style.display = 'inline-block';
	  showInfo('');
	}
	
	function startButton(event) {
		console.log("mic start");
	  if (recognizing) {
		recognition.stop();
		return;
	  }
	  final_transcript = '';
	  //recognition.lang = select_dialect.value;
	  //recognition.lang = 'en-US';
	  recognition.start();
	  ignore_onend = false;
	  final_span.innerHTML = '';
	  interim_span.innerHTML = '';
	  start_img.src = './img/mic-slash.gif';
	  showInfo('info_allow');
	  showButtons('none');
	  start_timestamp = event.timeStamp;
	}
	
	function showInfo(s) {
	  if (s) {
		for (var child = info.firstChild; child; child = child.nextSibling) {
		  if (child.style) {
			child.style.display = child.id == s ? 'inline' : 'none';
		  }
		}
		info.style.visibility = 'visible';
	  } else {
		info.style.visibility = 'hidden';
	  }
	}
	
	var current_style;
	function showButtons(style) {
	  if (style == current_style) {
		return;
	  }
	  current_style = style;
	  copy_button.style.display = style;
	  email_button.style.display = style;
	  copy_info.style.display = 'none';
	  email_info.style.display = 'none';
	}
	