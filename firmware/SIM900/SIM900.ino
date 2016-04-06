#include <SoftwareSerial.h>
#include "Commander.h"

// application config
const int GSM_BAUDRATE = 19200;
const int COM_BAUDRATE = 19200;

// pin config
const int GSM_PWRKEY_PIN = 9;

// serials
Serial_ *local = &Serial;
//HardwareSerial *remote = &Serial1;
SoftwareSerial *remote = new SoftwareSerial(10, 8);

// runtime
unsigned long lastUpdateTime = 0;
unsigned long lastButtonPressTime = 0;
boolean isGsmModulePoweredOn = false;

Commander commander(local);

void setup() {
  setupPinModes();
  setupSerials();
}

void loop() {
  unsigned long currentTime = millis();
  unsigned long dt = currentTime - lastUpdateTime;
  
  updateSerials(currentTime, dt);
  updateCommander(currentTime, dt);

  lastUpdateTime = currentTime;
}

void setupPinModes() {
  pinMode(GSM_PWRKEY_PIN, OUTPUT);
  // pinMode(7, INPUT);
}

void setupSerials() {
  local->begin(COM_BAUDRATE);
  remote->begin(GSM_BAUDRATE);
}

void updateSerials(unsigned long currentTime, unsigned long dt) {
  /*while (local->available() > 0) {
    char character = local->read();

    remote->print(character);
  }*/
  
  while (remote->available() > 0) {
    char character = remote->read();

    local->print(character);
  }
}

void updateCommander(unsigned long currentTime, unsigned long dt) {
  while (commander.gotCommand()) {
    handleCommand(commander.command, commander.parameters, commander.parameterCount);
  }
}

void toggleGsmPower() {
  digitalWrite(GSM_PWRKEY_PIN, LOW);
  delay(1000);
  digitalWrite(GSM_PWRKEY_PIN, HIGH);
  delay(2000);
  digitalWrite(GSM_PWRKEY_PIN, LOW);
  delay(3000);

  local->println("done!");
}

void sendTextMessage(String number, String message) {
  remote->print("AT+CMGF=1\r");
  
  delay(100);
  remote->print("AT + CMGS = \"");
  remote->print(number);
  remote->println("\"");
  
  delay(100);
  remote->println(message);
  
  delay(100);
  remote->println((char)26);// the ASCII code of the ctrl+z is 26
  
  delay(100);
  remote->println();
}

void readTextMessage(String index) {
  remote->print("AT+CMGR=");
  remote->print(index);
  remote->print("\r");
}

void startCall(String number) {
 remote->print("ATD + ");
 remote->print(number);
 remote->println(";");
 
 delay(100);
 remote->println();
}

void endCall() {
  remote->println("ATH");
}

void httpGet(String url) {
  remote->println("AT+CSQ");
  delay(100);
  showGsmOutput();
 
  remote->println("AT+CGATT?");
  delay(100);
  showGsmOutput();
 
  remote->println("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");//setting the SAPBR, the connection type is using gprs
  delay(1000);
  showGsmOutput();
 
  remote->println("AT+SAPBR=3,1,\"APN\",\"internet.emt.ee\"");//setting the APN, the second need you fill in your local apn server
  delay(4000);
  showGsmOutput();
 
  remote->println("AT+SAPBR=1,1");//setting the SAPBR, for detail you can refer to the AT command mamual
  delay(2000);
  showGsmOutput();
 
  remote->println("AT+HTTPINIT"); //init the HTTP request
  delay(2000); 
  showGsmOutput();
 
  remote->print("AT+HTTPPARA=\"URL\",\"");// setting the httppara, the second parameter is the website you want to access
  remote->print(url);
  remote->println("\"");
  delay(1000);
  showGsmOutput();
 
  remote->println("AT+HTTPACTION=0");//submit the request 
  delay(10000);//the delay is very important, the delay time is base on the return from the website, if the return datas are very large, the time required longer.
  //while(!remote->available());
  showGsmOutput();
 
  remote->println("AT+HTTPREAD");// read the data from the website you access
  delay(300);
  showGsmOutput();
 
  remote->println("");
  delay(100);
}

void showGsmOutput()
{
  while(remote->available() != 0) {
    local->write(remote->read());
  }
}

void handleCommand(String command, String parameters[], int parameterCount) {
  if (command == "on" && parameterCount == 0) {
    handleOnCommand();
  } else if (command == "off" && parameterCount == 0) {
    handleOffCommand();
  } else if (command == "cmd" && parameterCount == 1) {
    handleCmdCommand(parameters);
  } else if (command == "sms" && parameterCount == 2) {
    handleSendSmsCommand(parameters);
  } else if (command == "read" && parameterCount == 1) {
    handleReadSmsCommand(parameters);
  } else if (command == "call" && parameterCount == 1) {
    handleCallCommand(parameters);
  } else if (command == "recharge" && parameterCount == 1) {
    handleRechargeCommand(parameters);
  } else if (command == "http" && parameterCount == 1) {
    handleHttpCommand(parameters);
  } else {
    local->print("Unhandled command '");
    local->print(command);
    local->print("' with ");
    local->print(parameterCount);
    local->println(" parameters: ");
    
    for (int i = 0; i < parameterCount; i++) {
      local->print("  > ");
      local->print(i);
      local->print(": ");
      local->println(parameters[i]);
    }
  }
}

void handleOnCommand() {
  if (isGsmModulePoweredOn) {
    local->println("Module is already turned on, ignoring request");

    return;
  }

  local->println("Turning GSM module on");

  toggleGsmPower();
}

void handleOffCommand() {
  if (!isGsmModulePoweredOn) {
    local->println("Module is already turned off, ignoring request");

    return;
  }

  local->println("Turning GSM module off");

  toggleGsmPower();
}

void handleCmdCommand(String parameters[]) {
  String cmd = parameters[0];

  local->print("Forwarding AT command '");
  local->print(cmd);
  local->println("'");

  remote->print(cmd);
  remote->print('\r');  
}

void handleSendSmsCommand(String parameters[]) {
  String number = parameters[0];
  String message = parameters[1];

  local->print("Sending SMS message '");
  local->print(message);
  local->print("' to number '");
  local->print(number);
  local->println("'");
  
  sendTextMessage(number, message);
}

void handleReadSmsCommand(String parameters[]) {
  String index = parameters[0];

  local->print("Reading SMS message #");
  local->println(index);
  
  readTextMessage(index);
}

void handleCallCommand(String parameters[]) {
  String number = parameters[0];

  local->print("Calling number '");
  local->print(number);
  local->println("'");
  
  startCall(number);
  delay(20000);
  endCall();
}

void handleRechargeCommand(String parameters[]) {
  String hiddenNumber = parameters[0];
  String callNumber = "*142*" + hiddenNumber + "#";

  local->print("Recharging with '");
  local->print(hiddenNumber);
  local->print("' by calling '");
  local->print(callNumber);
  local->print("' for 20 seconds... ");
  
  startCall(callNumber);
  delay(20000);
  endCall();

  local->println("done!");
}

void handleHttpCommand(String parameters[]) {
  String url = parameters[0];

  local->print("Fetching HTTP GET '");
  local->print(url);
  local->println("'");

  httpGet(url);
}
