import SceneCardsContainer from "@/design-system/cards/scenecard/SceneCardsContainer";
import { ScrollView, StyleSheet } from 'react-native';

const SceneCardTesting = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SceneCardsContainer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default SceneCardTesting;