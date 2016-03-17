# Cumulocity
**Cumulocity IoT platform evaluation and experiments.**

## REST API
- Replace "telia" in the requests with your personal tenant name.
- All requests should be made using basic auth credentials.
- You can use [Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en) Google Chrome extension to run the requests.
- There's a [Postman collection](http://www.cumulocity.com/guides/rest/Cumulocity%20API.json.postman_collection) of various Cumulocity API requests for playing around with.

### Create device
*POST https://telia.cumulocity.com/inventory/managedObjects*
```
REQUEST
{
	"name": "Arduino",
	"c8y_IsDevice": {},
	"c8y_SupportedMeasurements": ["c8y_TemperatureMeasurement"]
}

RESPONSE
{
  "assetParents": {
    "references": [],
    "self": "https://telia.cumulocity.com/inventory/managedObjects/59708/assetParents"
  },
  "childAssets": {
    "references": [],
    "self": "https://telia.cumulocity.com/inventory/managedObjects/59708/childAssets"
  },
  "childDevices": {
    "references": [],
    "self": "https://telia.cumulocity.com/inventory/managedObjects/59708/childDevices"
  },
  "creationTime": "2016-03-17T13:34:36.936+01:00",
  "deviceParents": {
    "references": [],
    "self": "https://telia.cumulocity.com/inventory/managedObjects/59708/deviceParents"
  },
  "id": "59708",
  "lastUpdated": "2016-03-17T13:34:36.936+01:00",
  "name": "Arduino",
  "owner": "priit.kallas@telia.ee",
  "self": "https://telia.cumulocity.com/inventory/managedObjects/59708",
  "c8y_SupportedMeasurements": [
    "c8y_TemperatureMeasurement"
  ],
  "c8y_IsDevice": {}
}
```

### Transmit measurement data
*POST https://telia.cumulocity.com/measurement/measurements*
```
REQUEST
{
    "c8y_TemperatureMeasurement": {
        "T": {
            "value": 21.23,
            "unit":"C"
        }
    },
    "time": "2016-03-17T13:34:36.936+01:00",
    "source": {
        "id": "59708"
    },
    "type":"c8y_PTCMeasurement"
}

RESPONSE
{
  "id": "60362",
  "self": "https://telia.cumulocity.com/measurement/measurements/60362",
  "source": {
    "id": "59708",
    "self": "https://telia.cumulocity.com/inventory/managedObjects/59708"
  },
  "time": "2016-03-17T13:34:36.936+01:00",
  "type": "c8y_PTCMeasurement",
  "c8y_TemperatureMeasurement": {
    "T": {
      "unit": "C",
      "value": 21.23
    }
  }
}
```