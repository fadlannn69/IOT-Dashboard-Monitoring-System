#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include "secrets.h"

// FIREBASE
FirebaseData fbdo;
FirebaseAuth auth;    
FirebaseConfig config;



void setup() {
  Serial.begin(115200);

  // ===== WIFI =====
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nWiFi connected");

  // ===== FIREBASE =====
  config.api_key = " ";          
  config.database_url = "https://ujikom-fadlann-default-rtdb.asia-southeast1.firebasedatabase.app";
  Firebase.begin(&config, &auth);    
  Firebase.reconnectNetwork(true);
  Serial.println("Firebase connected");

  // ====== LAMPU =======




  // ====== SERVO =======


  // ====== DHT =========

  // ====== API =========
}
void loop() {


}
