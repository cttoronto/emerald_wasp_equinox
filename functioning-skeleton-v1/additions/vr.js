/*global window, document, setInterval, clearInterval, console, socket, setTimeout */
var SpeechRecognition = window.webkitSpeechRecognition || false,
    Vr;

// Only enable speech services if it is available
if (SpeechRecognition) {

    (function () {
        "use strict";

        // Setup a new Voice Recognition object
        Vr = function () {

            // To allow for self referencing
            var self = this;

            this.ears               = null;     // The holder for the recognition server
            this.listening          = false;    // Whether or not the server should be listening
            this.currentlyListening = false;    // Whether is is currently listening
            this.hearingAid         = null;     // An interval for checking and ensuring the server is listening
            this.pauseListening     = false;    // A holder for other classes of a similar (you can likely guess the intent)
            this.availableCommands  = [];       // An array of available commands to listen for (see below)

            // Initializer of the object
            this.initialize = function () {

                // Set the ears to the native Speech Recognition ser
                self.ears = new SpeechRecognition();

                // Assign the appropriate callbacks to the ears
                self.ears.onstart   = self.onStartListening;
                self.ears.onend     = self.onEndListening;
                self.ears.onresult  = self.onHearingResult;

            };

            // Commence listening and setup the interval check
            this.beginListening = function () {

                // Confirm that the ears should be listening
                self.listening = true;

                // Setup  a check to see if the ears are listening
                self.hearingAid = setInterval(self.validateListening, 250);

            };

            // End listening and clear the interval check
            this.stopListening = function () {

                // Confirm that the browser shouldn't be listening
                self.listening = false;

                // Clear the interval
                clearInterval(self.hearingAid);

                // Stop listening
                self.ears.stop();

            };

            // Voice recognition does not always remain on, this checks to ensure that it should be but isn't, that it re-enables
            this.validateListening = function () {

                // Check to see if the ears are currently listening as well as SHOULD be
                if (self.listening === true && self.currentlyListening === false) {

                    // Ignore activating if listening is currently paused
                    if (self.pausedListening !== true) {

                        // Activate the ears
                        self.ears.start();

                    }

                }

            };

            // Start listing callback
            this.onStartListening = function () {

                // Confirm that the browser is currently listening
                self.currentlyListening = true;

            };

             // End listening callback
            this.onEndListening = function () {

                // Confirm that the browser is currently not listening
                self.currentlyListening = false;

            };

            // Recognized literation callback
            this.onHearingResult = function (response) {

                // Variable for looping through result possibilities
                var i;

                // Loop through the results until the final one is found
                for (i = response.resultIndex; i < response.results.length; i = i + 1) {

                    // Process onl the final recognized text
                    if (response.results[i].isFinal) {
                        console.log(response.results[i][0].transcript);
                        self.parseLiteration(response.results[i][0].transcript);
                    }
                }
            };

            this.parseLiteration = function (literation) {

                // Set the variables required for parsing
                var foundCommand = false,
                    matchingCommand,
                    c;

                // Loop through the available commands to see if they match
                for (c = 0; c < self.availableCommands.length; c = c + 1) {
                    // Check if the current command matches
                    matchingCommand = self.availableCommands[c].isCurrent(literation);

                    // Perform a check whether to continue passing through other commands
                    if (matchingCommand) {

                        // Confirm that a command was found
                        foundCommand = true;

                        // Unless the command specifically states to continue, halt processing
                        if (matchingCommand.passThru !== true) {
                            break;
                        }

                    }

                }

            };

            // Perform the initialization
            this.initialize();

        };

        var VrCommand = function (regExpString, callback) {

            var self = this, i;

            this.strGREP = [];
            this.successfulCallback = callback || function () {};


            // Check to match the regular expression list and return a matching one
            this.checkRegularExpression = function (potentialCommand) {

                var i;

                // Compare to all expressions even if there is only 1
                for (i = 0; i < this.strGREP.length; i = i + 1) {
                    if (self.strGREP[i].test(potentialCommand)) {
                        return self.strGREP[i];
                    }
                }

                // No expressions matched so return false
                return false;

            };

            // Externally called function to compare requested command from
            this.isCurrent = function (potentialCommand) {

                // Check to see if there is a regular expression that matches
                var matchingRegExp = self.checkRegularExpression(potentialCommand);

                // If no regular expression matches, simply return false
                if (!matchingRegExp) {
                    return false;
                }

                // If there is a matching regular expression, return the result
                return self.successfulCallback(potentialCommand, matchingRegExp);

            };

            // Upon loading the new command, add any string regular expressions to the list
            if (typeof regExpString === 'string') {
                self.strGREP.push(new RegExp(regExpString, 'gi'));
            }

            // If the regular expression supplied was an array, add each one
            if (typeof regExpString === 'object') {

                // Regular expression values come up as objects, this creates an array of it
                if (!regExpString.length) {
                    self.strGREP = [regExpString];
                }

                // Loop for all passed expressions
                for (i = 0; i < regExpString.length; i = i + 1) {
                    self.strGREP.push(regExpString[i]);
                }
            }

            return this;

        };

        // Create the Voice Recognition object overtop of itself;
        Vr = new Vr();

        // Breaking down the first one. Others follow suit:

        // Right Arm High
        // Add a new command to the available command array of the voice recognition object
        Vr.availableCommands.push(new VrCommand(

            // Using a regular expression, search for "right" space "hi" or "High"
            /right\sarm\s(hi|high)/gi,

            // Callback function upon matching the regular expression
            function () {

                // Perform the same emit as a button press but manually put in the key and value data
                socket.emit('btnPress', { key: '5', value : '255' });

                // After half a second, emit another button press of the same key to deactivate the pin
                setTimeout(function () { socket.emit('btnPress', { key: '5'}); }, 500);

                // Return the fact that there was a matching command and there is no need to continue through to the others
                return { passThru : false };

            }

        ));

        // Right Arm Low
        Vr.availableCommands.push(new VrCommand(/right\sarm\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '5', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '5'}); }, 500);
            return { passThru : false};
        }));

        // Left Arm High
        Vr.availableCommands.push(new VrCommand(/left\sarm\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '3', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '3'}); }, 500);
            return { passThru : false};
        }));

        // Left Arm Low
        Vr.availableCommands.push(new VrCommand(/left\sarm\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '3', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '3'}); }, 500);
            return { passThru : false};
        }));

        // Right Wrist High
        Vr.availableCommands.push(new VrCommand(/right\swrist\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '4', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '4'}); }, 500);
            return { passThru : false};
        }));

        // Right Wrist Low
        Vr.availableCommands.push(new VrCommand(/right\swrist\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '4', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '4'}); }, 500);
            return { passThru : false};
        }));

        // Left Wrist High
        Vr.availableCommands.push(new VrCommand(/left\swrist\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '2', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '2'}); }, 500);
            return { passThru : false};
        }));

        // Left Wrist Low
        Vr.availableCommands.push(new VrCommand(/left\swrist\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '2', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '2'}); }, 500);
            return { passThru : false};
        }));

        // Right Thigh High
        Vr.availableCommands.push(new VrCommand(/right\sthigh\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '8', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '8'}); }, 500);
            return { passThru : false};
        }));

        // Right Thigh Low
        Vr.availableCommands.push(new VrCommand(/right\sthigh\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '8', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '8'}); }, 500);
            return { passThru : false};
        }));

        // Left Thigh High
        Vr.availableCommands.push(new VrCommand(/left\sthigh\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '6', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '6'}); }, 500);
            return { passThru : false};
        }));

        // Left Thigh Low
        Vr.availableCommands.push(new VrCommand(/left\sthigh\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '6', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '6'}); }, 500);
            return { passThru : false};
        }));

        // Right Calf High
        Vr.availableCommands.push(new VrCommand(/right\scalf\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '9', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '9'}); }, 500);
            return { passThru : false};
        }));

        // Right Calf Low
        Vr.availableCommands.push(new VrCommand(/right\scalf\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '9', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '9'}); }, 500);
            return { passThru : false};
        }));

        // Left Calf High
        Vr.availableCommands.push(new VrCommand(/left\scalf\s(hi|high)/gi, function () {
            socket.emit('btnPress', { key: '7', value : '255' });
            setTimeout(function () { socket.emit('btnPress', { key: '7'}); }, 500);
            return { passThru : false};
        }));

        // Left Calf Low
        Vr.availableCommands.push(new VrCommand(/left\scalf\s(lo|low)/gi, function () {
            socket.emit('btnPress', { key: '7', value : '120' });
            setTimeout(function () { socket.emit('btnPress', { key: '7'}); }, 500);
            return { passThru : false};
        }));

        // Append a callback function to the empty '<i>' tag in the HTML.
        // (Hint: it sits on the mouth of the skeleton)
        document.getElementsByTagName('i')[0].addEventListener('click', function () {

            // Begin listening only if the mouth has been clicked
            Vr.beginListening();

            // Create a new DOM element to place the instructions within.
            var instructions = document.createElement('div');

            // Style it and add the content
            instructions.setAttribute('style', 'position: absolute; top: 35px; right: 35px; width: 300px;');
            instructions.innerHTML = '<p>Approve the microphone request and you can use voice commands to help test.</p><p>Body parts are either "Left" or "Right".</p><p>Example:<br /><em>"Left Arm High" = Pin 3 high</em></p>' +
                '<h3 style="margin-bottom: 0px;">Available Limbs</h3>' +
                '<ul style="margin-top: 0px;">' +
                    '<li>Arm</li>' +
                    '<li>Wrist</li>' +
                    '<li>Thigh</li>' +
                    '<li>Calf</li>' +
                '</ul>';

            // Append the instructions to the body
            document.getElementsByTagName('body')[0].appendChild(instructions);

        });

    }());

}