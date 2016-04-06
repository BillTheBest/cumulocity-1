#include "CumulocityPlatform.h"
#include "SIM900.h"
#include <SoftwareSerial.h>

const char* DEVICE_NAME = "SIM900";

CumulocityPlatform client("telia.cumulocity.com", "telia", "priit.kallas@telia.ee", "purgisupp", "devicemanagement");
GSMModule* gsmModule;

boolean isSuccessfullyRegistered = false;


/*
 * Replace DEVICE_NAME with desired value
 */

void setup()
{
	pinMode(13, OUTPUT);
	digitalWrite(13, LOW);
	delay(10000);
	digitalWrite(13, HIGH);

	Serial.begin(19200);

	Serial.print(F("Setting up GSM module.. "));
	gsmModule = new GSMModule();
	Serial.println(F("done!"));

	Serial.print(F("Attaching GPRS.. "));

	if (gsmModule->attachGPRS("internet.emt.ee", "", ""))
	{
		Serial.println(F("done!"));

		client.setGSM(gsmModule);

		char id[8];
		const char* supportedOperations[2];
		const char* supportedMeasurements[1];
		supportedOperations[0] = "c8y_Relay";
		supportedOperations[1] = "c8y_Message";
		supportedMeasurements[0] = "c8y_LightMeasurement";

		Serial.print(F("Registering device '"));
		Serial.print(DEVICE_NAME);
		Serial.print(F("'.. "));

		int result = client.registerDevice(DEVICE_NAME, id, 8, supportedOperations, 2, supportedMeasurements, 1);

		if (result < 0)
		{
			Serial.print(F("got registration error: "));
			Serial.print(result);
			Serial.println();
		}
		else
		{
			Serial.print(F("successfully registered with id: "));
			Serial.println(id);

			isSuccessfullyRegistered = true;
		}

		delay(1000);
	}
	else
	{
		Serial.println(F("failed to attach GPRS"));
	}
}

void loop()
{
	if (!isSuccessfullyRegistered)
	{
		return;
	}

	raiseAlarm();
	sendMeasurement();

	delay(60000);
}

void sendMeasurement()
{
	int value = random(0, 101);

	Serial.print(F("Sending measurement '"));
	Serial.print(value);
	Serial.println("'.. ");

	int result = client.sendMeasurement("Light", "2016-04-06T09:37:21.966Z", "c8y_LightMeasurement", "e", value, "lx");

	Serial.print(F("done with result: "));
	Serial.print(result);
	Serial.println();
}

void raiseAlarm()
{
	Serial.print(F("Raising alarm.. "));
	int result = client.raiseAlarm("com_cumulocity_events_TamperEvent", "ACTIVE", "MINOR", "2016-04-06T09:37:21.966Z", "Tamper sensor triggered");

	if (result < 0)
	{
		Serial.println(F("failed"));
	}
	else
	{
		Serial.println(F("done!"));
	}
}