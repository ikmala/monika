<div align="center">

# MONIKA
### Monitoring Kualitas Air — IoT Aquaculture Platform

<p>
  Aplikasi mobile berbasis IoT untuk pemantauan kualitas air tambak udang secara <strong>real-time</strong>, dilengkapi sensor pH, suhu, dan TDS yang terhubung ke ESP32 melalui Firebase.
</p>

<img src="./assets/images/monika1.png" alt="MONIKA App Preview" width="600"/>

<br/>

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-11.1-FFCA28?logo=firebase&logoColor=black)

</div>

---

## Tampilan Aplikasi

<div align="center">
  <img src="./assets/images/monika2.png" alt="MONIKA Real Device" width="350"/>
</div>

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Realtime Monitoring** | Pantau nilai pH, Suhu, dan TDS secara langsung dari sensor ESP32 |
| **Grafik Historis** | Visualisasi data kualitas air dalam bentuk line chart berdasarkan rentang tanggal |
| **Export Data** | Unduh rekap data sensor ke format file untuk analisis lebih lanjut |
| **Manajemen Alat** | Koneksi ke perangkat ESP32 via QR Code scan |
| **Notifikasi** | Peringatan otomatis ketika nilai sensor di luar ambang normal |
| **Autentikasi** | Login dan registrasi akun pengguna via Firebase Auth |
| **Multi-device** | Satu akun dapat mengelola beberapa perangkat ESP32 |

---

## Tech Stack

### Mobile App
- **[Expo](https://expo.dev)** SDK 54 — framework React Native
- **[React Native](https://reactnative.dev)** 0.81.5
- **TypeScript** 5.9
- **[Expo Router](https://expo.github.io/router)** — file-based navigation
- **[NativeWind](https://www.nativewind.dev)** v4 — Tailwind CSS untuk React Native
- **[Firebase](https://firebase.google.com)** v11 — Auth, Firestore, Realtime Database
- **[react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)** — visualisasi grafik

### Hardware (ESP32)
- **[PlatformIO](https://platformio.org)** — embedded development platform
- **Firebase ESP Client** — koneksi Firebase dari ESP32
- Sensor: pH, EC/TDS, Suhu DS18B20, DO
- LCD I2C 20x4
- Web server lokal via ESPAsyncWebServer

---

## Struktur Proyek

```
mobile/
├── app/
│   ├── (auth)/          # Login & Signup
│   ├── (componens)/     # Header, Notifikasi, Setting, Detail Alat
│   ├── (tabs)/          # Beranda, Kualitas Air, Udang, Akun
│   └── _layout.tsx
├── assets/
│   ├── fonts/
│   └── images/
├── hooks/               # Custom hooks & utilities
├── firebase.js          # Firebase initialization
├── .env                 # Credentials (tidak diupload)
└── .env.example         # Template credentials
```

---

## Cara Menjalankan

### Prasyarat
- Node.js >= 18
- npm atau yarn
- [Expo Go](https://expo.dev/go) di HP (untuk development)
- Akun Firebase

### Instalasi

**1. Clone repository**
```bash
git clone https://github.com/username/monika.git
cd monika/mobile
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment variables**
```bash
cp .env.example .env
```

Buka file `.env` dan isi dengan nilai dari [Firebase Console](https://console.firebase.google.com):
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-rtdb.asia-southeast1.firebasedatabase.app/
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**4. Jalankan aplikasi**
```bash
npx expo start
```

Scan QR code menggunakan aplikasi Expo Go, atau tekan:
- `a` — buka di Android Emulator
- `i` — buka di iOS Simulator
- `w` — buka di browser

---

## Setup Hardware (ESP32)

Lihat direktori [`../esp/`](../esp/) untuk panduan firmware ESP32 lengkap.

```
esp/
├── src/
│   ├── main.cpp             # Program utama
│   ├── credentials.h        # Credentials (tidak diupload)
│   └── credentials.h.example
├── lib/                     # Library sensor
└── platformio.ini
```

**Setup credentials ESP32:**
```bash
cd ../esp/src
cp credentials.h.example credentials.h
# Edit credentials.h dengan WiFi & Firebase credentials kamu
```

---

## Konfigurasi Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com)
2. Aktifkan **Authentication** (Email/Password)
3. Aktifkan **Firestore Database**
4. Aktifkan **Realtime Database**
5. Tambahkan app Android/iOS dan salin config ke file `.env`

**Struktur Realtime Database:**
```
{DEVICE_ID}/
  ├── PH        (number)
  ├── TDS       (number)
  └── Temp      (number)
```

---

## Environment Variables

| Variable | Keterangan |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `EXPO_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database URL |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID |

> **Catatan:** File `.env` tidak akan pernah diupload ke GitHub. Lihat `.env.example` sebagai referensi.

---

## Build untuk Produksi

Proyek ini menggunakan **EAS Build** dari Expo:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login ke akun Expo
eas login

# Build Android APK
eas build --platform android --profile preview

# Build untuk Play Store
eas build --platform android --profile production
```

---

## Kontribusi

1. Fork repository ini
2. Buat branch baru: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m "feat: tambah fitur X"`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## Lisensi

Distributed under the MIT License.

---

<div align="center">
  <p>Dibuat untuk penelitian pemantauan kualitas air tambak udang</p>
</div>
