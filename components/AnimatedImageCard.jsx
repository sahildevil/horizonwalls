import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import ImageCard from "./ImageCard";

const AnimatedImageCard = ({
  item,
  currentTheme,
  CARD_MARGIN,
  CARD_WIDTH,
  CARD_HEIGHT,
  index, // Add index prop
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);
  const rotate = useSharedValue(-10);

  useEffect(() => {
    // Calculate delay based on index position
    const delay = (index % 20) * 100; // 100ms delay between each item in the current page

    // Reset values before animating
    scale.value = 0;
    opacity.value = 0;
    translateY.value = 100;
    rotate.value = -10;

    // Start animations
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 0.5,
      })
    );

    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 12,
        stiffness: 100,
        mass: 0.5,
      })
    );

    rotate.value = withDelay(
      delay,
      withSpring(0, {
        damping: 12,
        stiffness: 100,
        mass: 0.5,
      })
    );
  }, [index, item._id]); // Add dependencies to trigger animation on item change

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          margin: CARD_MARGIN,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <ImageCard
        imageUrl={item.image}
        wallpaperName={item.name}
        style={[
          styles.card,
          {
            backgroundColor: currentTheme.cardBackground,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    overflow: "hidden",
  },
});

export default AnimatedImageCard;
