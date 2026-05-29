import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import TabBarButton from "./TabBarButton";
import { icon } from "./icon";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: "transparent" }}>
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        start={[0, 0]}
        end={[1, 1]}
      >
        <View
          style={[
            styles.tabbar,
            {
              bottom: Math.max(insets.bottom, 12), // 🔥 INI KUNCI
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];

            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : options.title ?? route.name;

            const isFocused = state.index === index;
            const routeName = route.name as keyof typeof icon;

            if (!(routeName in icon)) return null;

            return (
              <TabBarButton
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                onLongPress={() =>
                  navigation.emit({
                    type: "tabLongPress",
                    target: route.key,
                  })
                }
                isFocused={isFocused}
                routeName={routeName}
                color={isFocused ? "#12539B" : "gray"}
                label={label}
              />
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};


export default TabBar;

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 35,

    position: "absolute", // tetap boleh
    left: 0,
    right: 0,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
});

