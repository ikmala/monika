import React from "react";
import { Stack } from "expo-router";

export default function ComponenLayout() {
  return (
    <Stack>
      <Stack.Screen name="Header" options={{ headerShown: false }} />
      <Stack.Screen name="Notification" options={{ headerShown: false }} />
      <Stack.Screen name="Setting" options={{ headerShown: false }} />
      <Stack.Screen name="Detailalat" options={{ headerShown: false }} />
    </Stack>
  );
}
