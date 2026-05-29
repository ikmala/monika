import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import Header from "../(componens)/Header";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import { useRouter } from "expo-router";

interface KolamData {
  kolamName: string;
  jumlahUdang: number;
  tglMasuk: string;
  berat: number;
  panjang: number;
}

const Udang = () => {
  const router = useRouter();

  const [deviceId, setDeviceId] = useState("");
  const [kolamList, setKolamList] = useState<string[]>([]);
  const [dataKolam, setDataKolam] = useState<KolamData[]>([]);
  const [selectedOption, setSelectedOption] = useState("");

  const [sensorMaxValues, setSensorMaxValues] = useState({
    PH: 14,
    TDS: 1000,
    Temp: 100,
  });

  const [KualitasAiringData, setKualitasAiringData] = useState({
    PH: 0,
    TDS: 0,
    Temp: 0,
  });

  /* =========================
     Ambil deviceId dari user
     ========================= */
  useEffect(() => {
    const fetchUser = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.deviceId) {
          setDeviceId(userData.deviceId);
        }
      }
    };

    fetchUser();
  }, []);

  /* =========================
     Ambil list kolam (RTDB)
     ========================= */
  useEffect(() => {
    if (!deviceId) return;

    const db = getDatabase();
    const dbRef = ref(db, deviceId);

    const unsub = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const kolamNames = Object.keys(data);
        setKolamList(kolamNames);

        if (kolamNames.length > 0 && !selectedOption) {
          setSelectedOption(kolamNames[0]);
        }
      }
    });

    return () => unsub();
  }, [deviceId]);

  /* =========================
     Ambil data realtime kolam
     ========================= */
  useEffect(() => {
    if (!deviceId || !selectedOption) return;

    const db = getDatabase();
    const dbRef = ref(db, `${deviceId}/${selectedOption}`);

    const unsub = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setKualitasAiringData({
          PH: data.PH || 0,
          TDS: data.TDS || 0,
          Temp: data.Temp || 0,
        });
      }
    });

    return () => unsub();
  }, [deviceId, selectedOption]);

  /* =========================
     Determinan sensor
     ========================= */
  useEffect(() => {
    const fetchSensorMaxValues = async () => {
      if (!deviceId) return;

      const deviceDocRef = doc(db, "devices", deviceId);
      const deviceDoc = await getDoc(deviceDocRef);

      const defaultValues = {
        PH: 14,
        TDS: 1000,
        Temp: 100,
      };

      if (!deviceDoc.exists() || !deviceDoc.data()?.determinanValue) {
        await setDoc(
          deviceDocRef,
          { determinanValue: defaultValues },
          { merge: true }
        );
        setSensorMaxValues(defaultValues);
      } else {
        const d = deviceDoc.data()?.determinanValue;
        setSensorMaxValues({
          PH: d.PH || 14,
          TDS: d.TDS || 1000,
          Temp: d.Temp || 100,
        });
      }
    };

    fetchSensorMaxValues();
  }, [deviceId]);

  /* =========================
     Data kolam (Firestore)
     ========================= */
  useEffect(() => {
    const fetchKolamData = async () => {
      if (!deviceId) return;

      const docRef = doc(db, "kolam", deviceId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const processed = Object.entries(snap.data()).map(
          ([kolamName, kolamData]: [string, any]) => {
            const tgl = kolamData.tglMasuk?.toDate
              ? kolamData.tglMasuk.toDate()
              : kolamData.tglMasuk;

            return {
              ...kolamData,
              kolamName,
              tglMasuk: tgl
                ? tgl.toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "",
            };
          }
        );

        setDataKolam(processed as KolamData[]);
      }
    };

    fetchKolamData();
  }, [deviceId]);

  const getMaxValue = (key: keyof typeof sensorMaxValues) =>
    sensorMaxValues[key];

  /* =========================
     UI helper (TIDAK DIUBAH)
     ========================= */
  const card = (
    name: string,
    img: any,
    fungsi: string,
    data: { value: number; maxValue: number }
  ) => (
    <View className="bg-white border-white border rounded-2xl mx-3 w-44 overflow-hidden">
      <View className="bg-hore p-4 rounded-xl items-center">
        <TouchableOpacity
          className="p-5"
          onPress={() =>
            router.push({
              pathname: "/(componens)/Detailalat",
              params: {
                alatName: name,
                gambar: img,
                value: data.value,
                maxValue: data.maxValue,
                kolam: JSON.stringify(kolamList),
              },
            })
          }
        >
          <View className="bg-white rounded-full w-24 h-24" />
          <Image source={img} className="absolute w-24 h-24" />
        </TouchableOpacity>
        <Text className="text-lg font-poppinsBold text-white mt-2 text-center">
          {name}
        </Text>
        <Text className="text-sm text-white text-center">{fungsi}</Text>
      </View>
      <Text className="text-hore mt-2 font-poppinsBold text-center">
        Terintegrasi
      </Text>
    </View>
  );

  return (
    <ScrollView className="bg-primary">
      {Header()}

      {/* Perkembangan Udang */}
      <View className="p-5">
        <Text className="text-lg font-poppinsBold text-white">
          Perkembangan Udang
        </Text>
        <Text className="text-white font-poppinsMedium">
          Data selalu diperbarui
        </Text>
      </View>

      {/* Alat */}
      <ScrollView horizontal>
        <View className="flex-row">
          {card(
            "Detektor Suhu",
            require("@/assets/images/sensor_suhu.png"),
            "Mendeteksi suhu air kolam",
            { value: KualitasAiringData.Temp, maxValue: getMaxValue("Temp") }
          )}
          {card(
            "Detektor PH",
            require("@/assets/images/sensor_ph.png"),
            "Mengukur tingkat keasaman air",
            { value: KualitasAiringData.PH, maxValue: getMaxValue("PH") }
          )}
          {card(
            "Detektor TDS",
            require("@/assets/images/sensor_tds.png"),
            "Mengukur total padatan terlarut",
            { value: KualitasAiringData.TDS, maxValue: getMaxValue("TDS") }
          )}
        </View>
      </ScrollView>

      <View className="h-24" />
    </ScrollView>
  );
};

export default Udang;
