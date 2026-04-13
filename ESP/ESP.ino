#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Servo.h>
#include <DHT.h>
#include "secrets.h"

// ===== CONFIG =====
#define SERVO_PIN D5
#define TRIG_PIN  D6
#define ECHO_PIN  D7
#define FLAME_PIN D1
#define DHTPIN    D2
#define DHTTYPE   DHT11

const int ledPins[3] = {D0, D3, D4};

// ===== OBJECT =====
Servo myservo;
DHT dht(DHTPIN, DHTTYPE);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ===== STATE =====
struct SensorData {
  float distance;
  bool fire;
  float temp;
  float hum;
};

struct ControlData {
  int servo;
  bool led[3];
};

SensorData sensor;
ControlData control;

// ===== TIMER =====
unsigned long tFirebase = 0;
unsigned long tSensor   = 0;

const int intervalFirebase = 5000;
const int intervalSensor   = 4000;

bool firebaseReady = false;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  // LED
  for (int i = 0; i < 3; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // Hardware
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(FLAME_PIN, INPUT);

  myservo.attach(SERVO_PIN);
  myservo.write(0);

  dht.begin();

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(300);
  }

  // Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);

  firebaseReady = Firebase.ready();
}

// ================= SENSOR =================
void readSensors() {
  // Ultrasonic
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  sensor.distance = duration > 0 ? duration * 0.034 / 2 : -1;

  // Flame
  sensor.fire = digitalRead(FLAME_PIN) == LOW;

  // DHT
  sensor.hum = dht.readHumidity();
  sensor.temp = dht.readTemperature();
}

// ================= APPLY CONTROL =================
void applyControl() {
  myservo.write(constrain(control.servo, 0, 180));

  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPins[i], control.led[i]);
  }
}

// ================= FIREBASE READ =================
void readFirebase() {
  if (!firebaseReady) return;

  if (Firebase.RTDB.getJSON(&fbdo, "/control")) {
    FirebaseJson &json = fbdo.jsonObject();

    json.get(control.servo, "servo");

    for (int i = 0; i < 3; i++) {
      String key = "led" + String(i);
      json.get(control.led[i], key);
    }
  }
}

// ================= FIREBASE WRITE =================
void sendFirebase() {
  if (!firebaseReady) return;

  FirebaseJson json;
  json.set("jarak", sensor.distance);
  json.set("api", sensor.fire);
  json.set("suhu", sensor.temp);
  json.set("kelembaban", sensor.hum);

  Firebase.RTDB.setJSON(&fbdo, "/sensor", &json);
}

// ================= LOOP =================
void loop() {
  unsigned long now = millis();

  if (now - tSensor > intervalSensor) {
    tSensor = now;
    readSensors();
  }

  if (now - tFirebase > intervalFirebase) {
    tFirebase = now;
    readFirebase();
    applyControl();
    sendFirebase();
  }
}
