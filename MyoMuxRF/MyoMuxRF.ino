#include <SPI.h>
#include <VirtualWire.h>

// All definitions
#define NUMCHANNELS 6
#define HEADERLEN 4
#define PACKETLEN (NUMCHANNELS * 2 + HEADERLEN + 1)
#define SAMPFREQ 256                      // ADC sampling rate 256
#define TIMER2VAL (1024/(SAMPFREQ))       // Set 256Hz sampling frequency                    
#define LED1  13
#define CAL_SIG 9


// Global constants and variables
volatile unsigned char TXBuf[PACKETLEN];  //The transmission packet
volatile unsigned char TXIndex;           //Next byte to write in the transmission packet.
volatile unsigned char CurrentCh;         //Current channel being sampled.
volatile unsigned char counter = 0;	  //Additional divider used to generate CAL_SIG
volatile unsigned int ADC_Value = 0;	  //ADC current value

const int feedBackPIN    = 13;
const int RFTransmitter  = 5;
const int numConnected   = 6;
const int baselineValue  = 300;
const int outputPin      = 6;

const int    msgBufferLen = 1024;
char         msgBuffer[msgBufferLen];
String       tempMsg;

// identify the controller pins for the Analog Multiplexor 
// connected to the blue and red Olimex wires
int mux_blue_0 = 0;
int mux_blue_1 = 1;
int mux_blue_2 = 2;
int mux_blue_3 = 3;

int mux_red_0 = 8;
int mux_red_1 = 9;
int mux_red_2 = 10;
int mux_red_3 = 11;

int highThreshold = 150;
int midThreshold = 50;

String highSendValue = "9";
String midSendValue = "5";
String lowSendValue = "0";

// send a message over RF
void transmitMsg(String msg){
    msg.toCharArray(msgBuffer, msgBufferLen);
    vw_send((uint8_t*)msgBuffer, strlen(msgBuffer));
    vw_wait_tx();
}

void setup() {
  noInterrupts();  // Disable all interrupts before initialization
  
  pinMode(mux_blue_0, OUTPUT); 
  pinMode(mux_blue_1, OUTPUT); 
  pinMode(mux_blue_2, OUTPUT); 
  pinMode(mux_blue_3, OUTPUT); 
  
  pinMode(mux_red_0, OUTPUT); 
  pinMode(mux_red_1, OUTPUT); 
  pinMode(mux_red_2, OUTPUT); 
  pinMode(mux_red_3, OUTPUT); 

  digitalWrite(mux_blue_0, LOW);
  digitalWrite(mux_blue_1, LOW);
  digitalWrite(mux_blue_2, LOW);
  digitalWrite(mux_blue_3, LOW);
  
  digitalWrite(mux_red_0, LOW);
  digitalWrite(mux_red_1, LOW);
  digitalWrite(mux_red_2, LOW);
  digitalWrite(mux_red_3, LOW);
 
  Serial.begin(9600);

  pinMode(6, OUTPUT);  
 
  vw_set_ptt_inverted(true);    // Required by the RF module
  vw_setup(2000);               // bps connection speed
  vw_set_tx_pin(RFTransmitter); // Arduino pin to connect the receiver data pin
  
  interrupts();  // Enable all interrupts after initialization has been completed
}

void loop() {
  // clear the message to transmit
  tempMsg  = "";

  // loop through all the used connections on the Mux
  for (int i = 0; i < numConnected; i++) {
    // the value comes in a wave, so remove that
    int diff = baselineValue - readMux(i); 
 
    if ( abs(diff) > highThreshold ) {
      tempMsg += highSendValue;   // add the send value
      digitalWrite(13, HIGH);     // turn on the light
      analogWrite(outputPin, 255);        // tell the connected motor to go full
    } else if (abs(diff) > midThreshold && abs(diff) <= highThreshold) {
      tempMsg += midSendValue;
      analogWrite(outputPin, 100);  
    } else {
      tempMsg += lowSendValue;
      analogWrite(outputPin, 0);         // turn the output off
    }
  }
 
  Serial.println(tempMsg); // for testing reference
  
  // send the string containing all the Myo values
  transmitMsg(tempMsg);
}

int readMux(int channel){
  // tell the pins on the multiplexor what to do
  int controlPinsBlue[] = {mux_blue_0, mux_blue_1, mux_blue_2, mux_blue_3};
  int controlPinsRed[] = {mux_red_0, mux_red_1, mux_red_2, mux_red_3};

  int muxChannel[16][4]={
    {0,0,0,0}, //channel 0
    {1,0,0,0}, //channel 1
    {0,1,0,0}, //channel 2
    {1,1,0,0}, //channel 3
    {0,0,1,0}, //channel 4
    {1,0,1,0}, //channel 5
    {0,1,1,0}, //channel 6
    {1,1,1,0}, //channel 7
    {0,0,0,1}, //channel 8
    {1,0,0,1}, //channel 9
    {0,1,0,1}, //channel 10
    {1,1,0,1}, //channel 11
    {0,0,1,1}, //channel 12
    {1,0,1,1}, //channel 13
    {0,1,1,1}, //channel 14
    {1,1,1,1}  //channel 15
  };

  //loop through the 4 sig
  for(int i = 0; i < 4; i ++){
    digitalWrite(controlPinsBlue[i], muxChannel[channel][i]);

    digitalWrite(controlPinsRed[i], muxChannel[channel][i]);
  }

  //read the value at the OLIMEX pin
  int val = analogRead(0);

  //return the value
  return val;
}
