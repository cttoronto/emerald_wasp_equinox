// Required library for the RX-TX. It can be downloaded at:
// http://www.airspayce.com/mikem/arduino/
#include <VirtualWire.h>

// Feedback pin is (Optional)
int ledPin = 13;

// Set the static pin for the RX data line
int RXPin = 3

// Buffer variable
char SensorCharMsg[1024]; 

void setup() {
    Serial.begin(9600);           // Configure the serial connection to the computer
    pinMode(ledPin, OUTPUT);      // Setup of the feedback pin (Optional)

    /* Virtual Wire Start */
    vw_set_ptt_inverted(true);    // Required by the RF module
    vw_setup(2000);               // bps connection speed
    vw_set_rx_pin(RXPin);             // Arduino pin to connect the receiver data pin
    vw_rx_start();                // Start the receiver
    /* Virtual Wire End */
}

// Base loop, (Duh!)
void loop() {
    
    /*** INSERT INTO THE LOOP ***/
    uint8_t buf[VW_MAX_MESSAGE_LEN];        // Set the buffer object
    uint8_t buflen = VW_MAX_MESSAGE_LEN;    // Set the buffer length

    if (vw_get_message(buf, &buflen)) {     // If there is a message, begin capture

        int i;

        digitalWrite(13, HIGH);             // Set the feedback pin to HIGH (Optional)

        for (i = 0; i < buflen; i++) {      // Append the characters for however much the buffer is
          SensorCharMsg[i] = char(buf[i]);  // Append the character value of the buffer at the current length
        }
        SensorCharMsg[i+1] = '\0';          // End the message string

        /**********/
        // Function for parsing the value of SensorCharMsg and sending to the vibration motors
        /**********/

        Serial.println(SensorCharMsg);      // Print the output to the serial for various outputs to capture

        digitalWrite(13, LOW);

    }
    /*** END INSERT INTO THE LOOP ***/
}
