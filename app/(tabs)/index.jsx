// import { FlatList, StyleSheet, Text, View } from "react-native";
// import React from "react";
// import Header from "../../components/Header";
// import Feather from "@expo/vector-icons/Feather";
// import ImageCard from "../../components/ImageCard";
// import data from "../../data/images.json";

// const index = () => {
//   return (
//     <View style={styles.container}>
//       <Header />
//       {/* <FlatList
//         data={data}
//         renderItem={(item, index) => {
//           <ImageCard />;
//         }}
//       /> */}
//       <ImageCard />
//       <Text>Home</Text>
//       <View style={styles.imageCard}></View>
//     </View>
//   );
// };

// export default index;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "white",
//   },
//   imageCard: {
//     display: "flex",
//     flexDirection: "row",
//     padding: 10,
//     marginRight: 10,
//     gap: 10,
//   },
// });
import { FlatList, StyleSheet, View } from "react-native";
import React from "react";
import Header from "../../components/Header";
import ImageCard from "../../components/ImageCard";
import data from "../../data/images.json";

const Index = () => {
  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <ImageCard imageUrl={item.img} />}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});
