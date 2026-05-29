import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState(" ");
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDoc = doc(db, "users", userId);
          const userSnapshot = await getDoc(userDoc);
          if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            setUserName(data.name || "Pengguna");
          } else {
            console.error("No user data found!");
            setUserName("Pengguna");
          }
        } else {
          console.error("User not authenticated!");
          setUserName("Pengguna");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserName("Pengguna");
      }
    };
    fetchUserName();
  }, []);

  return (
    <View className="flex-row justify-between items-center mt-10 p-5">
      <View>
        <Text className="text-white font-poppinsMedium">Selamat Datang,</Text>
        <Text className="text-xl font-poppinsBold text-white">{userName}</Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          // className="mx-4"
          onPress={() => router.push("/Notification")}
        >
          <Text className="text-white">
            <Ionicons name="notifications-sharp" size={24} />
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
