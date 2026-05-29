#ifndef DO_CALIBRATION_H
#define DO_CALIBRATION_H

#include "Arduino.h"
#include "EEPROM.h"

#define DO_PIN 36          // Pin analog untuk sensor DO
#define VREF 3300          // VREF (mV) untuk ESP32
#define ADC_RES 4096       // Resolusi ADC ESP32 (12-bit)
#define EEPROM_CAL1_V 30   // Alamat EEPROM untuk CAL1_V
#define EEPROM_CAL1_T 34   // Alamat EEPROM untuk CAL1_T
#define EEPROM_CAL2_V 38   // Alamat EEPROM untuk CAL2_V
#define EEPROM_CAL2_T 42   // Alamat EEPROM untuk CAL2_T
#define EEPROM_MODE 46     // Alamat EEPROM untuk mode kalibrasi
#define EEPROM_INIT_FLAG 47 // Flag untuk menandakan EEPROM sudah diinisialisasi

// Tabel saturasi DO (dari DFRobot)
const uint16_t DO_Table[41] = {
    14460, 14220, 13820, 13440, 13090, 12740, 12420, 12110, 11810, 11530,
    11260, 11010, 10770, 10530, 10300, 10080, 9860, 9660, 9460, 9270,
    9080, 8900, 8730, 8570, 8410, 8250, 8110, 7960, 7820, 7690,
    7560, 7430, 7300, 7180, 7070, 6950, 6840, 6730, 6630, 6530, 6410};

class DOCalibration {
private:
    uint16_t cal1_v; // Voltase kalibrasi titik 1 (mV)
    uint8_t cal1_t;  // Suhu kalibrasi titik 1 (°C)
    uint16_t cal2_v; // Voltase kalibrasi titik 2 (mV)
    uint8_t cal2_t;  // Suhu kalibrasi titik 2 (°C)
    uint8_t calibration_mode; // 0: Single-point, 1: Two-point

public:
    DOCalibration() {
        EEPROM.begin(64);
        uint8_t initFlag;
        EEPROM.get(EEPROM_INIT_FLAG, initFlag);

        // Inisialisasi default jika EEPROM belum pernah diinisialisasi
        if (initFlag != 0xA5) { // Menggunakan byte unik sebagai flag
            Serial.println(F("[DO Calibration]... Inisialisasi EEPROM DO dengan nilai default."));
            cal1_v = 1600; // Default: 1600 mV
            cal1_t = 25;   // Default: 25°C
            cal2_v = 1300; // Default: 1300 mV
            cal2_t = 15;   // Default: 15°C
            calibration_mode = 0; // Default: Single-point

            EEPROM.put(EEPROM_CAL1_V, cal1_v);
            EEPROM.put(EEPROM_CAL1_T, cal1_t);
            EEPROM.put(EEPROM_CAL2_V, cal2_v);
            EEPROM.put(EEPROM_CAL2_T, cal2_t);
            EEPROM.put(EEPROM_MODE, calibration_mode);
            EEPROM.put(EEPROM_INIT_FLAG, (uint8_t)0xA5); // Set flag
            EEPROM.commit();
        } else {
            // Baca parameter kalibrasi dari EEPROM jika sudah diinisialisasi
            EEPROM.get(EEPROM_CAL1_V, cal1_v);
            EEPROM.get(EEPROM_CAL1_T, cal1_t);
            EEPROM.get(EEPROM_CAL2_V, cal2_v);
            EEPROM.get(EEPROM_CAL2_T, cal2_t);
            EEPROM.get(EEPROM_MODE, calibration_mode);
        }
    }

    // Membaca voltase DO (V)
    float readDOVoltage() {
        uint32_t raw = analogRead(DO_PIN);
        float voltage = (raw * VREF) / ADC_RES;
        return voltage / 1000.0; // Konversi mV ke V
    }

    // Menghitung nilai DO (µg/L, konversi ke mg/L di fungsi utama)
    int16_t readDO(float voltage_mv, float temperature_c) {
        uint8_t temp = (uint8_t)temperature_c;
        if (temp >= 41) temp = 40; // Pastikan indeks tidak melebihi batas array
        if (temp < 0) temp = 0;

        uint16_t voltage = (uint16_t)(voltage_mv * 1000); // Konversi V ke mV
        uint16_t v_saturation;

        if (calibration_mode == 0) {
            v_saturation = (uint32_t)cal1_v + (uint32_t)35 * temp - (uint32_t)cal1_t * 35;
        } else {
            // Tambahkan pemeriksaan untuk menghindari pembagian nol
            if (cal1_t == cal2_t) {
                Serial.println(F("[DO Calibration Error]... Suhu kalibrasi tinggi dan rendah tidak boleh sama dalam mode two-point. Menggunakan kalibrasi single-point sementara."));
                v_saturation = (uint32_t)cal1_v + (uint32_t)35 * temp - (uint32_t)cal1_t * 35; // Fallback ke single-point
            } else {
                v_saturation = (int16_t)((int8_t)temp - cal2_t) * ((uint16_t)cal1_v - cal2_v) / ((uint8_t)cal1_t - cal2_t) + cal2_v;
            }
        }
        
        // Pencegahan pembagian nol lebih lanjut
        if (v_saturation == 0) {
            Serial.println(F("[DO Calculation Error]... v_saturation adalah nol. Mengembalikan nilai DO 0."));
            return 0; 
        }

        return (voltage * DO_Table[temp] / v_saturation);
    }

    // Kalibrasi DO
    void calibrateDO(float voltage, char* cmd, float temperature) {
        uint16_t voltage_mv = (uint16_t)(voltage * 1000); // Konversi V ke mV
        uint8_t temp = (uint8_t)temperature;

        if (strstr(cmd, "CALDO0")) {
            calibration_mode = 0; // Gunakan single-point calibration
            cal1_v = voltage_mv;
            cal1_t = temp;
            EEPROM.put(EEPROM_CAL1_V, cal1_v);
            EEPROM.put(EEPROM_CAL1_T, cal1_t);
            EEPROM.put(EEPROM_MODE, calibration_mode);
            EEPROM.commit();
            Serial.println(F("[DO Calibration]... Single-point calibrated to 0 mg/L (approx.)"));
        } else if (strstr(cmd, "CALDO100")) {
            calibration_mode = 0; // Gunakan single-point untuk saturasi udara
            cal1_v = voltage_mv;
            cal1_t = temp;
            EEPROM.put(EEPROM_CAL1_V, cal1_v);
            EEPROM.put(EEPROM_CAL1_T, cal1_t);
            EEPROM.put(EEPROM_MODE, calibration_mode);
            EEPROM.commit();
            Serial.println(F("[DO Calibration]... Single-point calibrated to saturation (approx.)"));
        } else if (strstr(cmd, "CALDO2PT")) {
            calibration_mode = 1; // Aktifkan two-point calibration
            EEPROM.put(EEPROM_MODE, calibration_mode);
            EEPROM.commit();
            Serial.println(F("[DO Calibration]... Two-point calibration mode activated. Use CALDOHIGH and CALDOLOW"));
        } else if (strstr(cmd, "CALDOHIGH")) {
            if (calibration_mode != 1) {
                Serial.println(F("[DO Calibration Warning]... CALDOHIGH hanya berlaku dalam mode two-point. Silakan ENTERDO atau CALDO2PT terlebih dahulu."));
                return;
            }
            cal1_v = voltage_mv;
            cal1_t = temp;
            EEPROM.put(EEPROM_CAL1_V, cal1_v);
            EEPROM.put(EEPROM_CAL1_T, cal1_t);
            EEPROM.commit();
            Serial.println(F("[DO Calibration]... High point calibrated"));
        } else if (strstr(cmd, "CALDOLOW")) {
            if (calibration_mode != 1) {
                Serial.println(F("[DO Calibration Warning]... CALDOLOW hanya berlaku dalam mode two-point. Silakan ENTERDO atau CALDO2PT terlebih dahulu."));
                return;
            }
            cal2_v = voltage_mv;
            cal2_t = temp;
            EEPROM.put(EEPROM_CAL2_V, cal2_v);
            EEPROM.put(EEPROM_CAL2_T, cal2_t);
            EEPROM.commit();
            Serial.println(F("[DO Calibration]... Low point calibrated"));
        }
    }
};

#endif