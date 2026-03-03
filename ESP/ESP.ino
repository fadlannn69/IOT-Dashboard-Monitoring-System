#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "secrets.h"
#include <Servo.h>
#include <DHT.h>


// FIREBASE
FirebaseData fbdo;
FirebaseAuth auth;    
FirebaseConfig config;

// SERVO
Servo myservo;

// LAMPU
const int ledPins[3] = {D1, D2, D3}; 

// ULTRASONIC
#define TRIG_PIN D7
#define ECHO_PIN D6

// FLAME 
#define FLAME_PIN D4

// DHT11
#define DHTPIN D8
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);


void setup() {
  Serial.begin(115200);

  // ===== LED =====
  for (int i = 0; i < 3; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // ===== SERVO =====
  myservo.attach(D5);

  // ===== WIFI =====
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nWiFi connected");

  // ===== FIREBASE =====
  auth.user.email = "admin@gmail.com";
  auth.user.password = "Pzych0_";

  config.api_key = "AIzaSyASYEAnSMK81XvAJ9rh5CtsPzd3RP0W8V8";          
  config.database_url = "https://ujikom-fadlann-default-rtdb.asia-southeast1.firebasedatabase.app";

  Firebase.begin(&config, &auth);    
  Firebase.reconnectNetwork(true);

  Serial.println("Menunggu Firebase ready...");
  while (!Firebase.ready()) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nFirebase siap!");


  // ===== ULTRASONIC =====
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  // ===== FLAME =====
  pinMode(FLAME_PIN, INPUT);

  // ===== DHT11 =====
  dht.begin();

}

//  ================ loopppppppp ======================
void loop() {
  // ===== SERVO =====
  if (Firebase.RTDB.getInt(&fbdo, "/servo/angle")) {
    int angle = fbdo.intData();
    angle = constrain(angle, 0, 180);
    myservo.write(angle);
    Serial.print("Sudut diterima: ");
    Serial.println(angle);
  } else {
    Serial.println("Gagal membaca servo:");
    Serial.println(fbdo.errorReason());
  }

  // ===== LED =====
  for (int i = 1; i <= 3; i++) {
    String path = "/lampu/led" + String(i);
    if (Firebase.RTDB.getBool(&fbdo, path.c_str())) {
      bool statusLed = fbdo.boolData();
      digitalWrite(ledPins[i - 1], statusLed ? HIGH : LOW);
      Serial.print("LED");
      Serial.print(i);
      Serial.print(": ");
      Serial.println(statusLed);
    } else {
      Serial.print("Gagal membaca LED");
      Serial.println(i);
      Serial.println(fbdo.errorReason());
    }
  }

  delay(2000); // jangan terlalu cepat



  // ===== ULTRASONIC =====
  long duration;
  float distance;
  
  // Kirim trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Baca echo
  duration = pulseIn(ECHO_PIN, HIGH);
  
  // Hitung jarak (cm)
  distance = duration * 0.034 / 2;
  
  Serial.print("Jarak: ");
  Serial.print(distance);
  Serial.println(" cm");
  
  // Kirim ke Firebase
  if (Firebase.RTDB.setFloat(&fbdo, "/sensor/jarak", distance)) {
    Serial.println("Data jarak terkirim");
  } else {
    Serial.println("Gagal kirim jarak");
    Serial.println(fbdo.errorReason());
  }




  // ===== FLAME =====
  bool fireDetected = digitalRead(FLAME_PIN);
  
  Serial.print("Status Api: ");
  
  if (fireDetected == LOW) {   // biasanya LOW = ada api
    Serial.println("API TERDETEKSI ");
  
    // Kirim ke Firebase
    Firebase.RTDB.setBool(&fbdo, "/sensor/api", true);
  
  } else {
    Serial.println("Aman");
  
    Firebase.RTDB.setBool(&fbdo, "/sensor/api", false);
  }


  // ===== DHT11 =====
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Gagal membaca DHT11!");
  } else {
    Serial.print("Suhu: ");
    Serial.print(temperature);
    Serial.print(" °C | Kelembaban: ");
    Serial.print(humidity);
    Serial.println(" %");

    // Kirim ke Firebase
    if (Firebase.RTDB.setFloat(&fbdo, "/sensor/suhu", temperature)) {
      Serial.println("Suhu terkirim");
    } else {
      Serial.println("Gagal kirim suhu");
      Serial.println(fbdo.errorReason());
    }

    if (Firebase.RTDB.setFloat(&fbdo, "/sensor/kelembaban", humidity)) {
      Serial.println("Kelembaban terkirim");
    } else {
      Serial.println("Gagal kirim kelembaban");
      Serial.println(fbdo.errorReason());
    }
}

}
