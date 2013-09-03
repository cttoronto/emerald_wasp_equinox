/*global require, process */
var http	= require("http"), // NodeJS HTTP server
    url		= require("url"),  // URL management and processing
    path	= require("path"), // Filepath management
    fs		= require("fs"),   // Access to filesystem
	io		= require('socket.io').listen(1337), // Socket.io and listner
    webPort = 8080;            // Port number to use for web server

/**
 * Javascript based Arduino connection through Serial
 * https://github.com/rwaldron/johnny-five
 *
 * Instructions for connecting an Arduino board:
 * Open the Arduino IDE, select: File > Examples > Firmata > StandardFirmata
 * Upload the sketch to the device. Done!
 *
 */
var five	= require("johnny-five"),
	board	= new five.Board();

(function () {
    "use strict";

    // Create the web server to handle incoming traffic
    http.createServer(function (request, response) {

        // Parse any incoming traffic to a filename
        var uri         = url.parse(request.url).pathname,
            filename    = path.join(process.cwd(), uri);

        // Return the appropriate content per the request URI
        fs.exists(filename, function (exists) {

            // File does not exist so return an appropriate 404 page
            if (!exists) {
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            // Filename was not specified so set to the index.html file
            if (fs.statSync(filename).isDirectory()) {
                filename += '/index.html';
            }

            // File does exist, so read it out and return the content
            fs.readFile(filename, "binary", function (err, file) {

                // If there was a file reading error, return the error
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.write(err + "\n");
                    response.end();
                    return;
                }

                // Write the file out
                response.writeHead(200);
                response.write(file, "binary");
                response.end();
            });
        });
    }).listen(webPort, '127.0.0.1'); // Listen on the localhost under the specifed port number

    // LED setup settings
    var boardLEDs = [],     // Containing array for the LED objects
        startingLED = 2,    // The beginning pin for the LEDs
        endingLED = 9,      // The last pin of the LEDs
        n;

    // Wait until the board is ready before beginning to add the pins
    board.on("ready", function () {

        // Add only the pins between the starting and ending values
        for (n = startingLED; n <= endingLED; n = n + 1) {

            // Append an LED object to the boardLEDs array
            boardLEDs.push(new five.Led(n));

        }

    });

    // Socket connection setup
    io.sockets.on('connection', function (socket) {

        /***
         * Setup the listener for the button pressing
         * @param pinData   The properties of the button clicked
         *
         * If there is a value variable passed through the pinData
         * object of an integer between 0 and 255 or a percentage
         * string, it will set the output to that value.
         *
         */
        socket.on('btnPress', function (pinData) {

            var	i;

            // Loop through the board LEDs
            for (i = 0; i < boardLEDs.length; i = i + 1) {

                // If the LED pin number matches the supplied key, perform the adjustment
                if (boardLEDs[i].pin === parseInt(pinData.key, null)) {

                    // If the specified LED does not have an active state, enable it and set state to active
                    if (!boardLEDs[i].isActive) {

                        // Create a new variable in the object and set it to true for future activations
                        boardLEDs[i].isActive = true;

                        // If a value has been submitted to change the pin to, use it
                        if (pinData.value) {

                            // If the value supplied was a percentage value, parse it
                            if (pinData.value.charAt(pinData.value.length - 1) === '%') {

                                // Change the value into an integer
                                pinData.value = parseInt(pinData.value.substring(0, pinData.value.length - 1), null);

                                // Change that integer into a value that is between 0 and 255
                                pinData.value = Math.ceil(255 / 100 * pinData.value);

                            }

                            // Ensure that the pin value is not above 255
                            pinData.value = (parseInt(pinData.value, null) > 255) ? 255 : parseInt(pinData.value, null);

                        } else {

                            // If there was no pin value set, simply create the variable and associate it to 100
                            pinData.value = 100;

                        }

                        // With all the processing done to the value, it doesn't need cleaning, it's good to go.
                        boardLEDs[i].fade(pinData.value, 50);

                    } else {

                        // Set the active variable to false for future activations
                        boardLEDs[i].isActive = false;

                        // Deactivate the LED
                        boardLEDs[i].fade(0, 50);

                    }
                }
            }

        });

    });
}());