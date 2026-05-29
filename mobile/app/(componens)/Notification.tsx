import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const Notification = () => {
  const router = useRouter();
  const [hasNotification, setHasNotification] = useState(false);

  const notif = () => (
    <View>
      <View className="flex-row justify-between items-center rounded-xl border-black border-2 p-5 mb-2">
        <Text className="text-primary text-2xl font-poppinsBold">
          DataNotif
        </Text>
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity className="items-center bg-white py-2 px-6 rounded-full border-primary border-2">
            <Text className="text-red-500">
              <MaterialIcons name="delete" size={24} />
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <View className="p-10 mt-5">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {hasNotification ? (
        // Show notifications when available
        <View className="mt-10 p-5">
          <Text className="text-primary text-3xl font-poppinsBold">
            Notification
          </Text>
          <View className="h-[1px] bg-black mb-4" />
          <View className="mt-5">{notif()}</View>
        </View>
      ) : (
        // Show "Tidak Ada Notification" when no notifications are present
        <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Text className="text-bold">Tidak Ada Notification</Text>
        </View>
      )}
    </View>
  );
};

export default Notification;
