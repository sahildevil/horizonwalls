import React, { createContext, useContext, useState, useRef } from "react";
import { Animated } from "react-native";

const ScrollContext = createContext();

export const useScrollContext = () => useContext(ScrollContext);

export const ScrollProvider = ({ children }) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const tabBarAnimation = useRef(new Animated.Value(0)).current;

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    if (currentScrollY <= 0) {
      // At the top, always show the tab bar
      setIsScrollingDown(false);
      Animated.spring(tabBarAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else if (currentScrollY > lastScrollY.current) {
      // Scrolling down
      if (!isScrollingDown) {
        setIsScrollingDown(true);
        Animated.spring(tabBarAnimation, {
          toValue: 100, // Move downward out of view
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      }
    } else {
      // Scrolling up
      if (isScrollingDown) {
        setIsScrollingDown(false);
        Animated.spring(tabBarAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      }
    }

    // Update the last scroll position
    lastScrollY.current = currentScrollY;
  };

  return (
    <ScrollContext.Provider
      value={{ handleScroll, tabBarAnimation, isScrollingDown }}
    >
      {children}
    </ScrollContext.Provider>
  );
};
