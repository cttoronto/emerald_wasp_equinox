/*globals document, socket */
var QWOPKeys,
    activateQWOP;

(function () {
    "use strict";

    var k,

        // Submit a limb press or depress to the socket connection
        submitQWOPCommand = function (limb, state) {
            socket.emit('btnPress', {key: limb, value : state});
        },

        // Parse any keys pressed after the document has been initialized for QWOP play
        QWOPCommand = function (evt) {

            // set the limb value for all key events
            var currentKey,
                limb = false,
                pressed = (evt.type === 'keydown');

            // Depending on the key pressed, change the limb value to match the associate limb
            switch (evt.keyCode) {
            case 81: // "Q"
                limb = document.getElementById('left-leg-1a').dataset.key;
                currentKey = QWOPKeys.q;
                break;
            case 87: // "W"
                limb = document.getElementById('right-leg-1a').dataset.key;
                currentKey = QWOPKeys.w;
                break;
            case 79: // "O"
                limb = document.getElementById('left-leg-2a').dataset.key;
                currentKey = QWOPKeys.o;
                break;
            case 80: // "P"
                limb = document.getElementById('right-leg-2a').dataset.key;
                currentKey = QWOPKeys.p;
                break;
            }

            // If the limb value has been modified from the false state, submit the command
            if (limb) {

                // Add or remove the active class for the key based upon the action taken
                currentKey.className = (pressed) ? currentKey.className + ' active' : currentKey.className.replace(/\sactive/g, '');

                // depending on the type of key press, submit either the on or off state
                submitQWOPCommand(limb, ((pressed) ? 255 : 0));

            }
        };

    // Parse the key entered
    activateQWOP = function (evt) {

        // Check to see if the key pressed was "Q"
        if (evt.keyCode !== 81) {
            return;
        }

        // Remove the checking event listener
        document.removeEventListener('keyup', activateQWOP);

        // Create the keys as objects to the global variable
        QWOPKeys = {
            w : document.createElement('a'),
            q : document.createElement('a'),
            o : document.createElement('a'),
            p : document.createElement('a')
        };

        // Initialize each of the keys into a button using their name as several elements
        for (k = 0; k < Object.keys(QWOPKeys).length; k = k + 1) {

            // Set the class name to be a combination of both a unique element and a standard for CSS
            QWOPKeys[Object.keys(QWOPKeys)[k]].className = 'qwopbtn-' + Object.keys(QWOPKeys)[k];

            // Append the key as the text value of the DOM element as well
            QWOPKeys[Object.keys(QWOPKeys)[k]].innerHTML = Object.keys(QWOPKeys)[k].toUpperCase();

            // Append the newly created DOM element to the body
            document.getElementsByTagName('body')[0].insertBefore(QWOPKeys[Object.keys(QWOPKeys)[k]], document.getElementsByTagName('body')[0].firstChild);

        }

        // Add a keydown and keyup listener to the document
        document.addEventListener('keydown', QWOPCommand);
        document.addEventListener('keyup', QWOPCommand);

    };

        // Add the event listener for the to the document for checking if it's the right key
    document.addEventListener('keyup', activateQWOP);

}());