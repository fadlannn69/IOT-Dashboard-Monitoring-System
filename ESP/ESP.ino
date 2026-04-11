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
const int ledPins[3] = {D1, D2, D0}; 

// ===== ULTRASONIC =====
#define TRIG_PIN D7
#define ECHO_PIN D6

// ===== FLAME =====
#define FLAME_PIN D5

// ===== DHT =====
#define DHTPIN D4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ===== TIMER =====
unsigned long lastFirebase = 0;
unsigned long lastSensor = 0;

const int firebaseInterval = 5000; // 5 detik
const int sensorInterval   = 4000; // 4 detik

bool firebaseReady = false;

void setup() {
  Serial.begin(115200);
  delay(2000); // stabilisasi power

  // ===== LED =====
  for (int i = 0; i < 3; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // ===== SERVO =====
  myservo.attach(D8); 
  myservo.write(0);

  // ===== ULTRASONIC =====
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // ===== FLAME =====
  pinMode(FLAME_PIN, INPUT);

  // ===== DHT =====
  dht.begin();

  // ===== WIFI =====
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    Serial.print(".");
    delay(300);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected");
  } else {
    Serial.println("\nWiFi FAIL (lanjut offline)");
  }

  // ===== FIREBASE CONFIG =====
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);

  // tunggu max 5 detik
  start = millis();
  while (!Firebase.ready() && millis() - start < 5000) {
    delay(300);
  }

  firebaseReady = Firebase.ready();
  Serial.println(firebaseReady ? "Firebase Ready" : "Firebase FAIL");
}

// ================= LOOP =================
void loop() {
  unsigned long now = millis();

  // ===== FIREBASE CONTROL =====
  if (firebaseReady && now - lastFirebase > firebaseInterval) {
    lastFirebase = now;

    // ===== SERVO =====
    if (Firebase.RTDB.getInt(&fbdo, "/servo/angle")) {
      int angle = constrain(fbdo.intData(), 0, 180);
      myservo.write(angle);
      Serial.print("Servo angle: ");
      Serial.println(angle);
    }

    // ===== LED =====
    for (int i = 1; i <= 3; i++) {
      char path[20];
      sprintf(path, "/lampu/led%d", i);

      if (Firebase.RTDB.getBool(&fbdo, path)) {
        digitalWrite(ledPins[i - 1], fbdo.boolData());
        Serial.print("LED");
        Serial.print(i);
        Serial.print(": ");
        Serial.println(fbdo.boolData() ? "ON" : "OFF");
      }
    }
  }

  // ===== SENSOR =====
  if (now - lastSensor > sensorInterval) {
    lastSensor = now;

    // ===== ULTRASONIC =====
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    float distance = duration > 0 ? duration * 0.034 / 2 : -1;
    Serial.print("Jarak: ");
    Serial.println(distance);

    if (firebaseReady)
      Firebase.RTDB.setFloat(&fbdo, "/sensor/jarak", distance);

    // ===== FLAME =====
    bool fire = digitalRead(FLAME_PIN) == LOW;
    Serial.print("Flame: ");
    Serial.println(fire ? "DETECTED" : "SAFE");

    if (firebaseReady)
      Firebase.RTDB.setBool(&fbdo, "/sensor/api", fire);

    // ===== DHT =====
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
      Serial.print("Temp: ");
      Serial.print(t);
      Serial.print(" | Hum: ");
      Serial.println(h);

      if (firebaseReady) {
        Firebase.RTDB.setFloat(&fbdo, "/sensor/suhu", t);
        Firebase.RTDB.setFloat(&fbdo, "/sensor/kelembaban", h);
      }
    } else {
      Serial.println("DHT Error");
    }
  }
}