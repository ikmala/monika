import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React from "react";
import { Tabs } from "expo-router";
import TabBar from "@/hooks/TabBar";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "light",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="Beranda"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => (
            <Entypo name="home" size={focused ? 28 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="KualitasAir"
        options={{
          title: "Kualitas Air",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="water"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Akun"
        options={{
          title: "Akun",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name="user-alt"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
