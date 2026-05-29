#include "Arduino.h"
#include <WiFi.h>
#include "DFRobot_ESP_PH.h"
#include "DFRobot_ESP_EC.h"
#include "OneWire.h"
#include "DallasTemperature.h"
#include "EEPROM.h"
#include "DO_Calibration.h"
#include <LiquidCrystal_I2C.h>
#include "SPIFFS.h"
#include <Preferences.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <Firebase_ESP_Client.h>
#include "credentials.h"

#define DEVICE_ID "ESP32_001"
#define PH_PIN 39          // Pin analog untuk sensor pH
#define EC_PIN 35          // Pin analog untuk sensor EC
#define ONE_WIRE_BUS 4    // Pin untuk sensor temperatur DS18B20

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
DFRobot_ESP_PH ph;
DFRobot_ESP_EC ec;
DOCalibration doSensor;
AsyncWebServer server(80);
Preferences preferences;
LiquidCrystal_I2C lcd(0x27, 20, 4);  // LCD dengan I2C (20 kolom dan 4 baris)
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
FirebaseJson firestoreData;

unsigned long intervals[] = {
    1000U,   // 0: interval untuk mode kalibrasi
    2000U,   // 1
    3000U,   // 2
    5000U,   // 3: interval untuk pembacaan normal
    10000U,  // 4
    15000U,  // 5
    20000U,  // 6
    25000U,  // 7
    60000U,  // 8
    1800000U // 9
};
unsigned long last[] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
bool calibrationIsRunning = false;
bool wifiConnected = false;
float lastTemperature;
int i = 0;
unsigned long lastWiFiCheck = 0;

//inisialisasi fungsi
void wiFiConnection();
void startAPMode();
void cekWiFi(unsigned long currentMillis);
float getWaterTemperature();
float readPHVoltage();
float readECVoltage();
bool readSerial(char result[]);
void firebaseConnection();
void firebaseRealtime();
void firebaseFierstore(unsigned long currentMillis);
String determineStatusAir(float pH, float temp, float doValue, float tds);

void setup() {
  Serial.begin(115200);
  EEPROM.begin(64);       // Inisialisasi EEPROM dengan ukuran 64 byte
  sensors.begin();        // Inisialisasi sensor temperatur
  ph.begin();           // Inisialisasi pH dengan alamat EEPROM mulai dari 10
  ec.begin();           // Inisialisasi EC dengan alamat EEPROM mulai dari 20
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Mulai Bolo...");
  Serial.println("Program dimulai. Gunakan perintah serial untuk kalibrasi: ENTERPH, ENTEREC, ENTERDO, CALDO0, CALDO100, CALDO2PT, CALDOHIGH, CALDOLOW, EXITPH, EXITEC, EXITDO");

  preferences.begin("wifi-config", false);
  // clearWiFiConfig();     //buka komen ini jika ingin mengkosongkan penyimpanan konfigurasi wifi
  wiFiConnection();

  if (wifiConnected) {
    firebaseConnection();
  } else {
    startAPMode();
  }

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  while (!time(nullptr)) {
    delay(1000);
    Serial.println("Waiting for time sync...");
  }
  Serial.println("Time synchronized.");
}

void loop() {
    float temperature, phVoltage, phValue, ecVoltage, ecValue, doVoltage, doValue;
    unsigned long now = millis();
    cekWiFi(now);

    // Mode kalibrasi (interval 1000ms)
    if (now - last[0] >= intervals[0]) {
        last[0] = now;
        if (calibrationIsRunning) {
            Serial.println(F("[main]...>>>>>> calibration is running, to exit send exitph or exitec through serial <<<<<<"));
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Mode Kalibrasi");
            lcd.setCursor(1, 0);
            lcd.print("kalibrasi lewat");
            lcd.setCursor(2, 0);
            lcd.print("laptop bolo...");

            temperature = getWaterTemperature();
            //ph
            phVoltage = readPHVoltage();
            Serial.print(F("[pH Voltage]... phVoltage: "));
            Serial.println(phVoltage);
            phValue = ph.readPH(phVoltage, temperature);
            Serial.print(F("[pH Read]... pH: "));
            Serial.println(phValue);
            //ec
            ecVoltage = readECVoltage();
            Serial.print(F("[EC Voltage]... ecVoltage: "));
            Serial.println(ecVoltage);
            ecValue = ec.readEC(ecVoltage, temperature);
            Serial.print(F("[EC Read]... EC: "));
            Serial.print(ecValue);
            Serial.println(F("ms/cm"));
            //do
            doVoltage = doSensor.readDOVoltage();
            Serial.print(F("[DO Voltage]... doVoltage: "));
            Serial.println(doVoltage);
            doValue = doSensor.readDO(doVoltage, temperature) / 1000.0; // Konversi µg/L ke mg/L
            Serial.print(F("[DO Read]... DO: "));
            Serial.print(doValue);
            Serial.println(F("mg/L"));
        }

        char cmd[10];
        if (readSerial(cmd)) {
            strupr(cmd);
            if (calibrationIsRunning || strstr(cmd, "PH") || strstr(cmd, "EC") || strstr(cmd, "DO")) {
                calibrationIsRunning = true;
                Serial.println(F("[]... >>>>>calibration is now running PH, EC, and DO are reading, if you want to stop this process enter EXITPH, EXITEC, or EXITDO in Serial Monitor<<<<<"));
                if (strstr(cmd, "PH")) {
                    ph.calibration(readPHVoltage(), temperature, cmd);
                }
                if (strstr(cmd, "EC")) {
                    ec.calibration(readECVoltage(), temperature, cmd);
                }
                if (strstr(cmd, "DO") || strstr(cmd, "CALDO0") || strstr(cmd, "CALDO100") || strstr(cmd, "CALDO2PT") || strstr(cmd, "CALDOHIGH") || strstr(cmd, "CALDOLOW")) {
                    doSensor.calibrateDO(doSensor.readDOVoltage(), cmd, temperature);
                }
            }
            if (strstr(cmd, "EXITPH") || strstr(cmd, "EXITEC") || strstr(cmd, "EXITDO")) {
                calibrationIsRunning = false;
                Serial.println("Kalibrasi berhenti.");
            }
        }
    }

    // Mode pembacaan normal (interval 5000ms)
    if (now - last[3] >= intervals[3]) {
        last[3] = now;
        if (!calibrationIsRunning) {
            temperature = getWaterTemperature();
            Serial.print("temperature:");
            Serial.print(temperature, 1);
            Serial.println("^C");

            phVoltage = readPHVoltage();
            Serial.print("phVoltage:");
            Serial.println(phVoltage, 4);
            phValue = ph.readPH(phVoltage, temperature);
            Serial.print("pH:");
            Serial.println(phValue, 4);

            ecVoltage = readECVoltage();
            Serial.print("ecVoltage:");
            Serial.println(ecVoltage, 4);
            ecValue = ec.readEC(ecVoltage, temperature);
            Serial.print("EC:");
            Serial.print(ecValue, 4);
            Serial.println("ms/cm");

            doVoltage = doSensor.readDOVoltage();
            Serial.print("doVoltage:");
            Serial.println(doVoltage, 4);
            doValue = doSensor.readDO(doVoltage, temperature) / 1000.0; // Konversi µg/L ke mg/L
            Serial.print("DO:");
            Serial.print(doValue, 4);
            Serial.println("mg/L");

            //tampil ke LCD
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Temp: ");
            lcd.print(temperature, 1);
            lcd.println("^C");
            lcd.setCursor(1, 0);
            lcd.print("pH:");
            lcd.println(phValue, 4);
            lcd.setCursor(2, 0);
            lcd.print("EC:");
            lcd.println(ecValue, 4);
            lcd.println("ms/cm");
            lcd.setCursor(3, 0);
            lcd.print("DO:");
            lcd.print(doValue, 4);
            lcd.println("mg/L");

            //kirim ke firebase
            firebaseRealtime();
            firebaseFierstore(now);
        }
    }
}
//========================Fungsi Wifi===========================
void wiFiConnection() {
  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");
  String mode = preferences.getString("mode", "");
  String ip = preferences.getString("ip", "");
  String gateway = preferences.getString("gateway", "");
  String subnet = preferences.getString("subnet", "");

  if (ssid == "" || password == "") {
    Serial.println("Tidak ada konfigurasi WiFi yang tersimpan. Masuk ke mode AP.");
    return;
  }

  Serial.print("Mencoba menghubungkan ke WiFi: ");
  Serial.println(ssid);

  if (mode == "static") {
    IPAddress localIP, gatewayIP, subnetMask, dns1, dns2;
    localIP.fromString(ip);
    gatewayIP.fromString(gateway);
    subnetMask.fromString(subnet);
    dns1.fromString("8.8.8.8");
    dns2.fromString("8.8.4.4");
    WiFi.config(localIP, gatewayIP, subnetMask, dns1, dns2);
  }

  WiFi.begin(ssid.c_str(), password.c_str());

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nTerhubung ke WiFi!");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nGagal terhubung ke WiFi yang tersimpan.");
    WiFi.disconnect();
  }
}

void startAPMode() {
  Serial.println("Memulai mode Access Point...");
  WiFi.mode(WIFI_AP);
  uint64_t mac = ESP.getEfuseMac();
  String apName = String(AP_SSID) + String((uint16_t)(mac >> 32), HEX);
  WiFi.softAP(apName, AP_PASSWORD);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", "text/html");
  });

  server.on("/scan", HTTP_GET, [](AsyncWebServerRequest *request){
    int n = WiFi.scanNetworks();
    DynamicJsonDocument doc(1024);
    JsonArray ssids = doc.createNestedArray("ssids");
    for (int i = 0; i < n; i++) {
      ssids.add(WiFi.SSID(i));
    }
    String json;
    serializeJson(doc, json);
    request->send(200, "application/json", json);
  });

  server.on("/config", HTTP_POST, [](AsyncWebServerRequest *request){
    String ssid = request->arg("ssid");
    String password = request->arg("password");
    String mode = request->arg("mode");
    String ip = request->arg("ip");
    String gateway = request->arg("gateway");
    String subnet = request->arg("subnet");

    preferences.putString("ssid", ssid);
    preferences.putString("password", password);
    preferences.putString("mode", mode);
    if (mode == "static") {
      preferences.putString("ip", ip);
      preferences.putString("gateway", gateway);
      preferences.putString("subnet", subnet);
    }

    DynamicJsonDocument doc(256);
    doc["status"] = "ok";
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);

    delay(1000);
    ESP.restart();
  });

  server.begin();
  Serial.println("Server AP dimulai di 192.168.4.1");
}

void cekWiFi(unsigned long currentMillis) {
  if (currentMillis - lastWiFiCheck >= 5000) {
    lastWiFiCheck = currentMillis;
    if (WiFi.status() != WL_CONNECTED) {
      if (wifiConnected) {
        Serial.println("WiFi terputus!");
        wifiConnected = false;
      }
    }
  }
}

void clearWiFiConfig() {
  preferences.clear();
  Serial.println("Konfigurasi WiFi telah dihapus. ESP32 akan masuk ke mode AP saat di-restart.");
}

//========================Fungsi Sensor Utama===================
float getWaterTemperature() {
    sensors.requestTemperatures();
    float temperature = sensors.getTempCByIndex(0);
    if (temperature == 85.00 || temperature == -127.00) {
        temperature = lastTemperature;
    } else {
        lastTemperature = temperature;
    }
    Serial.println(String("[getWaterTemperature]... temperature : ") + String(temperature));
    return temperature;
}

float readPHVoltage() {
    int adcValue = analogRead(PH_PIN);
    float voltage = (adcValue / 4095.0) * 3.3; // Konversi ADC 12-bit ke voltase (0-3.3V)
    return voltage;
}

float readECVoltage() {
    int adcValue = analogRead(EC_PIN);
    float voltage = (adcValue / 4095.0) * 3.3; // Konversi ADC 12-bit ke voltase (0-3.3V)
    return voltage;
}

bool readSerial(char result[]) {
    while (Serial.available() > 0) {
        char inChar = Serial.read();
        if (inChar == '\n') {
            result[i] = '\0';
            Serial.flush();
            i = 0;
            return true;
        }
        if (inChar != '\r') {
            result[i] = inChar;
            i++;
        }
        delay(1);
    }
    return false;
}

//========================Fungsi Kirim Ke Firebase==============
void firebaseConnection(){
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = DEFAULT_USER_EMAIL;
  auth.user.password = DEFAULT_USER_PASSWORD;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void firebaseRealtime(){
  float temperature, phVoltage, phValue, ecVoltage, ecValue, doVoltage, doValue;
  temperature = getWaterTemperature();
  phVoltage = readPHVoltage();
  phValue = ph.readPH(phVoltage, temperature);
  ecValue = ec.readEC(ecVoltage, temperature);
  doValue = doSensor.readDO(doVoltage, temperature) / 1000.0;
  time_t now = time(nullptr);
  if (Firebase.ready()) {
    Serial.println("Firebase ready.");
    bool allDataSent = true;
    if (!Firebase.RTDB.setFloat(&fbdo, (String("devices/") + DEVICE_ID + "/temperature").c_str(), temperature)) {
      allDataSent = false;
      Serial.print("Temperature data error: ");
      Serial.println(fbdo.errorReason());
    }
    if (!Firebase.RTDB.setFloat(&fbdo, (String("devices/") + DEVICE_ID + "/TDS").c_str(), ecValue)) {
      allDataSent = false;
      Serial.print("TDS data error: ");
      Serial.println(fbdo.errorReason());
    }
    if (!Firebase.RTDB.setFloat(&fbdo, (String("devices/") + DEVICE_ID + "/pH").c_str(), phValue)) {
      allDataSent = false;
      Serial.print("pH data error: ");
      Serial.println(fbdo.errorReason());
    }
    if (!Firebase.RTDB.setFloat(&fbdo, (String("devices/") + DEVICE_ID + "/DO").c_str(), doValue)) {
      allDataSent = false;
      Serial.print("DO data error: ");
      Serial.println(fbdo.errorReason());
    }
    if (!Firebase.RTDB.setInt(&fbdo, (String("devices/") + DEVICE_ID + "/heartbeat").c_str(), now)) {
      allDataSent = false;
      Serial.print("Send data error: ");
      Serial.println(fbdo.errorReason());
    }
    if (allDataSent) {
      Serial.println("Data Firebase sent successfully");
    }
  } else {
    Serial.println("Firebase not ready, connection issue?");
  }
}

void firebaseFierstore(unsigned long currentMillis){
  if (currentMillis - lastWiFiCheck >= 1800000) {
    lastWiFiCheck = currentMillis;
    float temperature, phVoltage, phValue, ecVoltage, ecValue, doVoltage, doValue;
    temperature = getWaterTemperature();
    phVoltage = readPHVoltage();
    phValue = ph.readPH(phVoltage, temperature);
    ecValue = ec.readEC(ecVoltage, temperature);
    doValue = doSensor.readDO(doVoltage, temperature) / 1000.0;
    String statusAir = determineStatusAir(phValue, temperature, doValue, ecValue);
    time_t now;
    time(&now);
    struct tm *timeinfo;
    char timeString[25];
    timeinfo = gmtime(&now);
    strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%S", timeinfo);
    strcat(timeString, ".000Z");

    firestoreData.set("fields/temperatureC/doubleValue", String(temperature).c_str());
    firestoreData.set("fields/tdsValue/doubleValue", String(ecValue).c_str());
    firestoreData.set("fields/pHValue/doubleValue", String(phValue).c_str());
    firestoreData.set("fields/doValue/doubleValue", String(doValue).c_str());
    firestoreData.set("fields/statusAir/stringValue", statusAir.c_str());
    firestoreData.set("fields/timestamp/timestampValue", timeString);

    String userId = String(auth.token.uid.c_str());
    String userPath = "users/" + userId;
    if (Firebase.Firestore.getDocument(&fbdo, FIREBASE_PROJECT_ID, "", userPath.c_str())) {
      FirebaseJson payload;
      payload.setJsonData(fbdo.payload().c_str());
      FirebaseJsonData jsonData;
      payload.get(jsonData, "fields/device/stringValue", true);
      Serial.print("Device ID: ");
      String deviceId = jsonData.stringValue;
      Serial.println(deviceId);
      String documentPath = "devices/" + deviceId + "/data/" + String(millis());
      if (Firebase.Firestore.createDocument(&fbdo, FIREBASE_PROJECT_ID, "", documentPath.c_str(), firestoreData.raw())) {
        Serial.println("Data berhasil disimpan ke Firestore");
      } else {
        Serial.print("Kesalahan menyimpan data ke Firestore: ");
        Serial.println(fbdo.errorReason());
      }
    }
  }
}

String determineStatusAir(float pH, float temp, float doValue, float tds) {
  if ((pH >= 7.5 && pH <= 9.0) && (temp >= 20 && temp <= 30) && (doValue >= 4 && doValue <= 8) && (tds >= 5 && tds <= 30)) {
    return "Normal";
  } else if ((pH >= 7.0 && pH < 7.5) || (pH > 9.0 && pH <= 9.5) ||
              (temp >= 18 && temp < 20) || (temp > 30 && temp <= 32) ||
              (doValue >= 3 && doValue < 4) || (doValue > 8 && doValue <= 9) ||
              (tds >= 3 && tds < 5) || (tds > 30 && tds <= 35)) {
    return "Waspada";
  } else {
    return "Bahaya";
  }
}
