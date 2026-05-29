import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  Alert,
  Image,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";
import { getDatabase, ref, onValue } from "firebase/database";
import { updateEmail, updateProfile } from "firebase/auth";

const Akun = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [lastLogin, setlastLogin] = useState("");
  const [kolamList, setKolamList] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const router = useRouter();
  const [sensorMaxValues, setSensorMaxValues] = useState({
    DO: 300,
    PH: 14,
    TDS: 1000,
    Temp: 100,
  });

  const [KualitasAiringData, setKualitasAiringData] = useState({
    DO: 0,
    PH: 0,
    TDS: 0,
    Temp: 0,
  });
  const getMaxValue = (sensor: keyof typeof sensorMaxValues) => {
    return sensorMaxValues[sensor];
  };

  useEffect(() => {
  if (!deviceId) return;

  const dbRT = getDatabase();
  const dbRef = ref(dbRT, deviceId);

  const unsub = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      setKolamList(Object.keys(data));
    }
  });

  return () => unsub();
}, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    const dbRT = getDatabase();
    const path = `${deviceId}/kolam1`; // atau default kolam
    const dbRef = ref(dbRT, path);

    const unsub = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setKualitasAiringData({
          DO: data.DO || 0,
          PH: data.PH || 0,
          TDS: data.TDS || 0,
          Temp: data.Temp || 0,
        });
      }
    });

    return () => unsub();
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    const fetchSensorMaxValues = async () => {
      const refDoc = doc(db, "devices", deviceId);
      const snap = await getDoc(refDoc);

      if (snap.exists()) {
        const d = snap.data().determinanValue;
        setSensorMaxValues({
          DO: d?.DO || 300,
          PH: d?.PH || 14,
          TDS: d?.TDS || 1000,
          Temp: d?.Temp || 100,
        });
      }
    };

    fetchSensorMaxValues();
  }, [deviceId]);

  //untuk mengambil data firestore USER
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.log("User not logged in or no userId found.");
          return;
        }
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.deviceId) {
            setDeviceId(userData.deviceId);
            setUserName(userData.name);
            setUserEmail(userData.email);
            if (userData.lastLogin) {
              setlastLogin(userData.lastLogin.toDate().toLocaleString());
            }
          } else {
            console.log("QR Code not found in user document.");
          }
        } else {
          console.log("User document does not exist.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchQRCode();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // 🔁 UPDATE EMAIL LOGIN (AUTH)
      if (newUserEmail && newUserEmail !== user.email) {
        await updateEmail(user, newUserEmail);
      }

      // 👤 UPDATE DISPLAY NAME
      if (newUserName) {
        await updateProfile(user, {
          displayName: newUserName,
        });
      }

      // 🗄️ UPDATE FIRESTORE
      await updateDoc(doc(db, "users", user.uid), {
        name: newUserName || userName,
        email: newUserEmail || userEmail,
      });

      setUserName(newUserName || userName);
      setUserEmail(newUserEmail || userEmail);

      Alert.alert("Berhasil", "Profile berhasil diperbarui");
      setIsEditProfileVisible(false);
    } catch (error: any) {
      console.error(error);

      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Perlu Login Ulang",
          "Silakan logout dan login ulang untuk mengubah email."
        );
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };

  const edit = () => {
    return (
      <Modal
        visible={isEditProfileVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditProfileVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white/90 p-5 rounded-xl w-4/5">
            <Text className="text-xl font-poppinsBold text-center mb-4">
              Edit Profile
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Nama Baru"
              value={newUserName}
              onChangeText={setNewUserName}
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-2 mb-4"
              placeholder="Email Baru"
              keyboardType="email-address"
              value={newUserEmail}
              onChangeText={setNewUserEmail}
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-red-600 rounded-xl p-3 flex-1 mr-2"
                onPress={() => setIsEditProfileVisible(false)}
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-green-600 rounded-xl p-3 flex-1 ml-2"
                onPress={handleUpdateProfile}
              >
                <Text className="text-white text-center">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView className="bg-primary">
      {/* Header */}
      <View className="px-5 pt-5">
        <View className="flex-row justify-start px-5 pt-5">
          <View className="bg-white rounded-full flex items-center justify-center p-5 h-24 w-24">
            <FontAwesome name="user" size={34} color="black" />
          </View>
          <View className="p-5">
            <Text className="text-white text-3xl font-poppinsBold">
              {userName}
            </Text>
            <Text className="text-white font-poppinsRegular">{userEmail}</Text>
            {/* <TouchableOpacity
              className="bg-white rounded-3xl flex justify-center items-center border border-black py-2 px-5"
              onPress={() => setIsEditProfileVisible(true)}
            >
              <Text className="text-hore font-poppinsBold">Ubah Profile</Text>
            </TouchableOpacity> */}
          </View>
        </View>
        {edit()}
        <View className="bg-gray-400 py-0.5 my-5 rounded-full" />
      </View>

      {/* detail user */}
      <View className="mx-10">
        <View className="py-5">
          <Text className="text-white font-poppinsMedium">Nama Lengkap</Text>
          <Text className="text-white font-poppinsBold text-2xl">
            {userName}
          </Text>
        </View>
        <View className="py-5">
          <Text className="text-white font-poppinsMedium">Email</Text>
          <Text className="text-white font-poppinsBold text-2xl">
            {userEmail}
          </Text>
        </View>
        <View className="py-5">
          <Text className="text-white font-poppinsMedium">Terakhir Login</Text>
          <Text className="text-white font-poppinsBold text-2xl">
            {lastLogin}
          </Text>
        </View>
        <View className="bg-gray-400 py-0.5 my-5 rounded-full" />
      </View>

      {/* LOGOUT */}
      <View className="mx-10">
        <TouchableOpacity
          className="py-5 flex-row justify-start"
          onPress={() => router.replace("/(auth)/Login")}
        >
          <Feather name="log-out" size={24} color="white" />
          <Text className="text-white ml-3 mt-1 text-xl font-poppinsBold">
            Keluar
          </Text>
        </TouchableOpacity>
      </View>

      <View className="h-24" />
    </ScrollView>
  );
};

export default Akun;
