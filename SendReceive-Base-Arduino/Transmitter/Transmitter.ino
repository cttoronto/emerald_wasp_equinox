// Required library for the RX-TX. It can be downloaded at:
// http://www.airspayce.com/mikem/arduino/
#include <VirtualWire.h>

// Feedback pin is (Optional)
const int ledPin    = 13;

// Set the static pin for the TX data line
const int TXPin  = 5;

// Buffer variables
const int    msgBufferLen = 1024;
char         msgBuffer[msgBufferLen];

// Dynamic message string variable
String       tempMsg;

// Functionality for transmitting a message
void transmitMsg(String msg){
    
    // Convert the message string into a buffer of characters
    msg.toCharArray(msgBuffer, msgBufferLen);
    
    // Send the buffer using UTF8
    vw_send((uint8_t*)msgBuffer, strlen(msgBuffer));
    
    // Wait until the message has been transmitted in order to continue
    vw_wait_tx();

}

// Base loop, (Duh!)
void setup(){

    Serial.begin(9600);            // For Debugging    

    pinMode(ledPin, OUTPUT);      // Setup of the feedback pin (Optional)

    /* Virtual Wire Start */
    vw_set_ptt_inverted(true);     // Required by the RF module
    vw_setup(2000);                // bps connection speed
    vw_set_tx_pin(TXPin);          // Arduino pin to connect the receiver data pin
    /* Virtual Wire End */
}

void loop(){
    
    // Set the string message to send
    tempMsg  = "Hello World";
    
    // Visual feedback via LED light
    digitalWrite(ledPin, HIGH);
    
    // Send the message to the transmit function
    transmitMsg(tempMsg);
    
    // Turn off the visual feedback LED
    digitalWrite(ledPin, LOW);
    
    delay(1000);         // We wait to send the message again

}
