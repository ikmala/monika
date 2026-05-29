import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { EyeIcon } from "react-native-heroicons/outline";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, addDoc, collection } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebase";

const Signup = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("Semua field harus diisi.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    setErrorMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userId = userCredential.user.uid;

      const deviceRef = await addDoc(collection(db, "devices"), {
        userId,
      });

      await setDoc(doc(db, "users", userId), {
        name,
        email,
        deviceId: deviceRef.id,
        lastLogin: new Date(),
      });

      Alert.alert("Pendaftaran Berhasil", "Akun Anda berhasil dibuat");
      router.replace("/(tabs)/Beranda");
    } catch (error) {
      const err = error as FirebaseError;

      if (err.code === "auth/email-already-in-use") {
        setErrorMessage("Email sudah terdaftar.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage("Format email tidak valid.");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("Password minimal 6 karakter.");
      } else {
        setErrorMessage("Terjadi kesalahan. Coba lagi.");
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        extraScrollHeight={30}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-primary">

          {/* BACKGROUND */}
          <Image
            source={require("@/assets/images/vector-signup.png")}
            className="absolute top-28 w-full"
            resizeMode="cover"
          />

          {/* LOGO */}
          <View className="items-center mt-20">
            <Image source={require("@/assets/images/Logo_monika2.png")} />
          </View>

          {/* FORM */}
          <View className="flex-1 justify-end px-6 pb-16">

            <Text className="text-white text-2xl font-poppinsBold mb-4">
              Sign Up
            </Text>

            <Text className="text-white mb-6">
              Buat akun untuk memulai budidaya
            </Text>

            <TextInput
              placeholder="Name"
              placeholderTextColor="#002A58"
              className="bg-white p-4 rounded-full pl-6 mb-4"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#002A58"
              className="bg-white p-4 rounded-full pl-6 mb-4"
              value={email}
              onChangeText={setEmail}
            />

            <View className="flex-row items-center bg-white rounded-full mb-4">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#002A58"
                secureTextEntry={!showPassword}
                className="flex-1 p-4 pl-6"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="pr-4"
              >
                <EyeIcon size={20} color="black" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#002A58"
              secureTextEntry
              className="bg-white p-4 rounded-full pl-6 mb-2"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {errorMessage ? (
              <Text className="text-red-500 mb-4">{errorMessage}</Text>
            ) : null}

            <View className="flex-row justify-center mb-6">
              <Text className="text-secondary">
                Sudah punya akun?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/Login")}
              >
                <Text className="text-white font-bold">
                  Login
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              className="bg-white p-5 rounded-full"
            >
              <Text className="text-primary text-2xl text-center font-poppinsMedium">
                Daftar
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default Signup;
