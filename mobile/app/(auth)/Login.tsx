import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { EyeIcon } from "react-native-heroicons/outline";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { updateDoc, doc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      await updateDoc(doc(db, "users", uid), {
        lastLogin: new Date(),
      });

      router.replace("/(tabs)/Beranda");
    } catch (error) {
      const err = error as FirebaseError;
      setErrorMessage("Email atau password salah");
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
            source={require("@/assets/images/vector-login.png")}
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
              LOGIN
            </Text>

            <Text className="text-white mb-6">
              Login untuk masuk ke akunmu
            </Text>

            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#002A58"
              className="bg-white p-4 rounded-full pl-6 mb-4"
              value={email}
              onChangeText={setEmail}
            />

            <View className="flex-row items-center bg-white rounded-full mb-6">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#002A58"
                secureTextEntry={!showPassword}
                className="flex-1 p-4 pl-6"
                value={password}
                onChangeText={setPassword}
                style={{
                  color: "#002A58",
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="pr-4"
              >
                <EyeIcon size={20} color="black" />
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <Text className="text-red-500 mb-4">{errorMessage}</Text>
            ) : null}

            <View className="flex-row justify-center mb-6">
              <Text className="text-secondary font-interMedium">
                Belum memiliki akun?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/Signup")}>
                <Text className="text-white font-interBold">Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              className="bg-white p-5 rounded-full"
            >
              <Text className="text-primary text-2xl text-center font-poppinsMedium">
                Masuk
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

export default Login;
