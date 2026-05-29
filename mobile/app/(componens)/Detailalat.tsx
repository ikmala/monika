import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";

const Detailalat = () => {
  const { alatName, gambar, value, maxValue, unit } =
    useLocalSearchParams();

  const numericValue = Number(value ?? 0);
  const numericMaxValue = Number(maxValue ?? 1);

  const imageSource =
    typeof gambar === "string" && gambar.startsWith("http")
      ? { uri: gambar }
      : gambar;

  const pieCard = (value: number, unit: string, max: number) => {
    const strokeWidth = 10;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(value / max, 1) * circumference;

    return (
      <View className="flex items-center justify-center">
        <View className="relative">
          <Svg width={120} height={120}>
            <Circle
              cx="60"
              cy="60"
              r={radius}
              stroke="#3B82F6"
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
              transform="rotate(-90 60 60)"
            />
          </Svg>
          <View className="absolute inset-0 flex items-center justify-center">
            <Text className="text-4xl font-poppinsBold text-white">
              {value}
              {unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="bg-primary">
      {/* HEADER IMAGE */}
      <View className="bg-white h-80 relative">
        <View className="absolute p-5 mt-5 flex-row items-center z-10">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#195EA9" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-lg font-poppinsBold text-hore">
              Detail Alat
            </Text>
            <Text className="text-hore font-poppinsMedium">
              Monitoring Perangkat
            </Text>
          </View>
        </View>

        <View className="flex-1 justify-center items-center">
          <Image
            source={imageSource}
            className="w-48 h-48"
            resizeMode="contain"
          />
        </View>
      </View>

      {/* CONTENT */}
      <View className="p-5">
        <Text className="text-2xl font-poppinsBold text-white mb-5">
          {alatName}
        </Text>

        <View className="bg-hore rounded-3xl border border-white p-5">
          <View className="flex-row justify-between items-center">
            {pieCard(numericValue, String(unit ?? ""), numericMaxValue)}

            <View className="ml-5 flex-1">
              <Text className="text-white font-poppinsBold text-xl mb-2">
                Status Alat
              </Text>

              <View className="flex-row justify-between">
                <View>
                  <Text className="text-white">Kondisi</Text>
                  <Text className="text-white">Integrasi</Text>
                </View>
                <View>
                  <Text className="text-white font-bold">Baik</Text>
                  <Text className="text-white font-bold">Aktif</Text>
                </View>
              </View>

              <TouchableOpacity className="bg-primary rounded-full mt-6 py-2 border border-white items-center">
                <Text className="text-white font-poppinsMedium">
                  Rekap Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Detailalat;
