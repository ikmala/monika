import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../(componens)/Header";
import Svg, { Circle } from "react-native-svg";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import { useRouter } from "expo-router";

const Beranda = () => {
  const [deviceId, setDeviceId] = useState("");
  const router = useRouter();
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


  //untuk mengambil data firestore USER
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
useEffect(() => {
  if (!deviceId) return;

  const rtdb = getDatabase();
  const deviceRef = ref(rtdb, deviceId);

  const unsub = onValue(deviceRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();

      setKualitasAiringData({
        PH: data.PH ?? 0,
        TDS: data.TDS ?? 0,
        Temp: data.Temp ?? 0,
      });
    }
  });

  return () => unsub();
}, [deviceId]);


  //untuk mengambil data determinan
  useEffect(() => {
    const fetchSensorMaxValues = async () => {
      try {
        if (!deviceId) return;
        const deviceDocRef = doc(db, "devices", deviceId);
        const deviceDoc = await getDoc(deviceDocRef);
        if (deviceDoc.exists()) {
          const deviceData = deviceDoc.data();
          if (!deviceData.determinanValue) {
            const defaultDeterminanData = {
              PH: 14,
              TDS: 1000,
              Temp: 100,
            };
            await setDoc(
              deviceDocRef,
              { determinanValue: defaultDeterminanData },
              { merge: true }
            );
            setSensorMaxValues(defaultDeterminanData);
          } else {
            const determinanData = deviceData.determinanValue;
            setSensorMaxValues({
              PH: determinanData.PH || 14,
              TDS: determinanData.TDS || 1000,
              Temp: determinanData.Temp || 100,
            });
          }
        } else {
          const defaultDeterminanData = {
            PH: 14,
            TDS: 1000,
            Temp: 100,
          };
          await setDoc(
            deviceDocRef,
            { determinanValue: defaultDeterminanData },
            { merge: true }
          );
          setSensorMaxValues(defaultDeterminanData);
        }
      } catch (error) {
        console.error("Error fetching or creating sensor max values:", error);
      }
    };

    fetchSensorMaxValues();
  }, [deviceId]);

  const getMaxValue = (sensor: keyof typeof sensorMaxValues) => {
    return sensorMaxValues[sensor];
  };

  const pieCard = (name: string, value: number, unit: string, max: number) => {
    const strokeWidth = 10;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / max) * circumference;

    return (
      <View className="flex items-center justify-center p-2">
        <View className=" relative">
          <Svg width={120} height={120}>
            <Circle
              cx="60"
              cy="60"
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx="60"
              cy="60"
              r={radius}
              stroke="white"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              transform="rotate(90 60 60)"
            />
          </Svg>
          <View className="absolute inset-0 flex items-center justify-center">
            <Text className="text-4xl font-poppinsBold text-white">
              {value}
              {unit}
            </Text>
          </View>
        </View>

        {/* Nama di bawah chart */}
        <Text className="text-lg font-poppinsMedium text-white mt-2">
          {name}
        </Text>
      </View>
    );
  };

  const card = (
    name: string,
    img: string | number,
    fungsi: string,
    data: { value: number; maxValue: number }
  ) => {
    const imageSource = typeof img === "string" ? { uri: img } : img;

    return (
      <View className="bg-white border-white border rounded-2xl mx-3 w-44 overflow-hidden">
        <View className="bg-hore p-4 rounded-xl flex-1 items-center justify-center">
          <TouchableOpacity
            className="p-5 justify-center items-center"
            onPress={() =>
              router.push({
                pathname: "/(componens)/Detailalat",
                params: {
                  alatName: name,
                  gambar: img,
                  value: data.value,
                  maxValue: data.maxValue,
                },
              })
            }
          >
            <View className="bg-white rounded-full w-24 h-24" />
            <Image className="absolute w-24 h-24" source={imageSource} />
          </TouchableOpacity>
          <Text
            className="text-lg font-poppinsBold text-white mt-4 text-center"
            numberOfLines={2}
            adjustsFontSizeToFit={true}
          >
            {name}
          </Text>
          <Text
            className="text-sm font-poppinsRegular text-white mt-2 text-center"
            numberOfLines={3}
          >
            {fungsi}
          </Text>
        </View>
        <Text className="text-hore mt-2 font-poppinsBold text-center">
          Terintegrasi
        </Text>
      </View>
    );
  };

  return (
    <>
      <ScrollView className="bg-primary">
      {/* Header */}
      {Header()}

      {/* KualitasAiring Section */}
      <View className=" bg-hore rounded-3xl mx-3 p-5 border-white border">
        <View className="flex-row justify-between items-center ">
          <View>
            <Text className="text-lg font-poppinsBold text-white">
              Kualitas Air
            </Text>
            <Text className="text-white font-poppinsMedium">
              Data selalu diperbarui
            </Text>
          </View>
        </View>
        <ScrollView horizontal={true}>
          <View className="flex-row space-x-2">
            {pieCard("Suhu", KualitasAiringData.Temp, "°", getMaxValue("Temp"))}
            {pieCard("PH", KualitasAiringData.PH, "", getMaxValue("PH"))}
            {pieCard("TDS", KualitasAiringData.TDS, "", getMaxValue("TDS"))}
          </View>
        </ScrollView>
        <TouchableOpacity
          className="bg-white mt-4 py-3 rounded-full"
          onPress={() => router.replace("/(tabs)/KualitasAir")}
        >
          <Text className="text-center text-hore font-poppinsBold">
            Cek Kualitas Air
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alat Terintegrasi */}
      <View className="mt-5">
        <View className="p-5">
          <Text className="text-lg font-poppinsBold text-white">
            Alat Terintegrasi
          </Text>
          <Text className="text-white font-poppinsMedium">
            Aplikasi telah terhubung dengan alat
          </Text>
        </View>
        <ScrollView horizontal={true}>
          <View className="flex-row space-x-2">
            {card(
              "Detektor Suhu",
              require("@/assets/images/sensor_suhu.png"),
              "Digunakan untuk mendeteksi suhu pada kolam",
              { value: KualitasAiringData.Temp, maxValue: getMaxValue("Temp") }
            )}
            {card(
              "Detektor PH",
              require("@/assets/images/sensor_ph.png"),
              "Digunakan untuk mengukur tingkat keasaman air kolam",
              { value: KualitasAiringData.PH, maxValue: getMaxValue("PH") }
            )}
            {card(
              "Detektor TDS",
              require("@/assets/images/sensor_tds.png"),
              "Digunakan untuk mengukur total padatan terlarut dalam air kolam",
              { value: KualitasAiringData.TDS, maxValue: getMaxValue("TDS") }
            )}
          </View>
        </ScrollView>
      </View>

      <View className="h-24" />
    </ScrollView>
    </>
  );
};

export default Beranda;