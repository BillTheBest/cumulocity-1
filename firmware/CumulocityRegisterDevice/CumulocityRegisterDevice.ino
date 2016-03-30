#include "CumulocityPlatform.h"
#include "SIM900.h"
#include <SoftwareSerial.h>

CumulocityPlatform cPlatform("telia.cumulocity.com", "telia", "priit.kallas@telia.ee", "purgisupp", "devicemanagement");
GSMModule* mod;

boolean isSuccessfullyRegistered = false;


/*
 * Replace DEVICE_NAME with desired value
 */

void setup() {
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  delay(10000);
  digitalWrite(13, HIGH);
  
  Serial.begin(19200);
  Serial.println(F("Start"));
  mod = new GSMModule();
  Serial.println(F("Attaching GPRS..."));
  if(mod->attachGPRS("internet.emt.ee", "", "")) {
    cPlatform.setGSM(mod);

    char id[8];
    const char* supportedOperations[2];
    const char* supportedMeasurements[1];
    supportedOperations[0] = "c8y_Relay";
    supportedOperations[1] = "c8y_Message";
    supportedMeasurements[0] = "c8y_LightMeasurement";

    Serial.println(F("Registering a device..."));
    int result = cPlatform.registerDevice("telia1", id, 8, supportedOperations, 2, supportedMeasurements, 1);

    if(result<0) {
      Serial.print(F("Registration error: "));
      Serial.print(result);
      Serial.println();
    } else {
      Serial.print(F("Arduino registered with id: "));
      Serial.println(id);

      isSuccessfullyRegistered = true;
    }

    delay(1000);
  } else {
    Serial.println(F("Could not attach GPRS."));
  }
}

void loop() {
  if (!isSuccessfullyRegistered) {
    return;
  }

  int value = random(0, 101);

  Serial.print(F("Sending measurement: "));
  Serial.print(value);
  Serial.println("... ");
  
  int result = cPlatform.sendMeasurement("Light", "c8y_LightMeasurement", "e", value, "lx");

  Serial.print(F("done with result: "));
  Serial.print(result);
  Serial.println();

  delay(60000);
}
