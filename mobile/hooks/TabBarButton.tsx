import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { icon } from "@/hooks/icon";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GestureResponderEvent } from "react-native";

const TabBarButton = ({
  onPress,
  onLongPress,
  isFocused,
  routeName,
  color,
  label,
}: {
  onPress: (event: GestureResponderEvent) => void;
  onLongPress: (event: GestureResponderEvent) => void;
  isFocused: boolean;
  routeName: keyof typeof icon;
  color: string;
  label: string | (() => React.ReactNode);
}) => {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(
      typeof isFocused === "boolean" ? (isFocused ? 1 : 0) : isFocused,
      { duration: 350 }
    );
  }, [scale, isFocused]);
  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [0, 1], [1, 0]);
    return {
      opacity: opacity,
      fontSize: 10,
    };
  });
  const IconComponent = icon[routeName];
  const animatedIconStyle = useAnimatedStyle(() => {
    const iconSize = interpolate(scale.value, [0, 1], [20, 28]);
    return {
      transform: [{ scale: iconSize / 20 }],
    };
  });
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabbarItem}
    >
      {IconComponent ? (
        <Animated.View style={animatedIconStyle}>
          <IconComponent color={color} />
        </Animated.View>
      ) : null}
      <Animated.Text style={[{ color: isFocused ? "#12539B" : "#222" }]}>
        {typeof label === "string" ? label : label()}
      </Animated.Text>
    </Pressable>
  );
};

export default TabBarButton;

const styles = StyleSheet.create({
  tabbarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
});
