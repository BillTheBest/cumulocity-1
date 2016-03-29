#include "Commander.h"

// application config
const int GSM_BAUDRATE = 19200;
const int COM_BAUDRATE = 115200;
const unsigned long BTN_DEBOUNCE_PERIOD_MS = 300;

// pin config
const int GSM_PWRKEY_PIN = 9;

// serials
Serial_ *local = &Serial;
HardwareSerial *remote = &Serial1;

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

void handleCommand(String command, String parameters[], int parameterCount) {
  if (command == "on" && parameterCount == 0) {
    handleOnCommand();
  } else if (command == "off" && parameterCount == 0) {
    handleOffCommand();
  } else if (command == "cmd" && parameterCount == 1) {
    handleCmdCommand(parameters);
  } else if (command == "sms" && parameterCount == 2) {
    handleSmsCommand(parameters);
  } else if (command == "call" && parameterCount == 1) {
    handleCallCommand(parameters);
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

void handleSmsCommand(String parameters[]) {
  String number = parameters[0];
  String message = parameters[1];

  local->print("Sending SMS message '");
  local->print(message);
  local->print("' to number '");
  local->print(number);
  local->println("'");
  
  sendTextMessage(number, message);
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
