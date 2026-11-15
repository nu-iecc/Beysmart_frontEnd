import { ScrollView } from 'react-native';
import { sceneCardData } from '../../../constans/constantfile';
import CreateNewSceneCard from './CreateNewSceneCard';
import SceneCard from './scenecard';

const SceneCardsContainer = () => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
    >
      {sceneCardData.map((item) => (
        <SceneCard
          key={item.id}
          title={item.title}
          gradientColors={item.colors}
          titleColor={item.titleColor}
          icons={item.icons}
          onPressButton={() => {}}
          cardStyle={item.cardStyle}
        />
      ))}
      
      <CreateNewSceneCard onPress={() => {}} />
    </ScrollView>
  );
};

export default SceneCardsContainer;
