#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "secrets.h"
#include <Servo.h>
#include <DHT.h>

// ===== FIREBASE =====
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ===== SERVO =====
Servo myservo;

// ===== LED =====
const int ledPins[3] = {D1, D2, D3};

// ===== ULTRASONIC =====
#define TRIG_PIN D7
#define ECHO_PIN D6

// ===== FLAME =====
#define FLAME_PIN D4

// ===== DHT =====
#define DHTPIN D8
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ===== TIMER =====
unsigned long lastFirebase = 0;
unsigned long lastSensor = 0;

const int firebaseInterval = 5000;  // 5 detik
const int sensorInterval   = 3000;  // 3 detik

void setup() {
  Serial.begin(115200);

  // LED
  for (int i = 0; i < 3; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // SERVO
  myservo.attach(D5);

  // ULTRASONIC
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // FLAME
  pinMode(FLAME_PIN, INPUT);

  // DHT
  dht.begin();

  // WIFI
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(F("Connecting WiFi"));
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(F("."));
    delay(300);
  }
  Serial.println(F("\nWiFi Connected"));

  // FIREBASE
  auth.user.email = "ujikom@iot.com";
  auth.user.password = "UjikomFadlann123_";

  config.api_key = "YOUR_API_KEY";
  config.database_url = "YOUR_DB_URL";

  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);

  Serial.println(F("Menunggu Firebase..."));
  while (!Firebase.ready()) {
    delay(300);
    Serial.print(F("."));
  }
  Serial.println(F("\nFirebase Ready"));
}

// ================= LOOP =================
void loop() {

  unsigned long now = millis();

  // ================= FIREBASE CONTROL =================
  if (now - lastFirebase > firebaseInterval) {
    lastFirebase = now;

    // SERVO
    if (Firebase.RTDB.getInt(&fbdo, "/servo/angle")) {
      int angle = constrain(fbdo.intData(), 0, 180);
      myservo.write(angle);
      Serial.print(F("Servo: "));
      Serial.println(angle);
    }

    // LED (tanpa String)
    for (int i = 1; i <= 3; i++) {
      char path[20];
      sprintf(path, "/lampu/led%d", i);

      if (Firebase.RTDB.getBool(&fbdo, path)) {
        digitalWrite(ledPins[i - 1], fbdo.boolData() ? HIGH : LOW);
      }
    }
  }

  // ================= SENSOR =================
  if (now - lastSensor > sensorInterval) {
    lastSensor = now;

    // ===== ULTRASONIC =====
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000); // timeout
    float distance = duration * 0.034 / 2;

    Serial.print(F("Jarak: "));
    Serial.println(distance);

    Firebase.RTDB.setFloat(&fbdo, "/sensor/jarak", distance);

    // ===== FLAME =====
    bool fire = digitalRead(FLAME_PIN) == LOW;
    Firebase.RTDB.setBool(&fbdo, "/sensor/api", fire);

    // ===== DHT =====
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
      Firebase.RTDB.setFloat(&fbdo, "/sensor/suhu", t);
      Firebase.RTDB.setFloat(&fbdo, "/sensor/kelembaban", h);

      Serial.print(F("Temp: "));
      Serial.print(t);
      Serial.print(F(" | Hum: "));
      Serial.println(h);
    } else {
      Serial.println(F("DHT Error"));
    }
  }
}
