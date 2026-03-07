import { Stack } from "expo-router";
import { useTheme } from '../../utils/themeContext';
import { Colors } from '../../constants/Colors';

export default function CameraLayout() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="scanCollectionConfirm"
        options={{
          headerShown: false,
          gestureEnabled: true,
          contentStyle: { backgroundColor: '#000' }, // Camera screens typically use black background
        }}
      />
      <Stack.Screen
        name="scanReference"
        options={{
          headerShown: false,
          gestureEnabled: true,
          contentStyle: { backgroundColor: '#000' },
        }}
      />
      <Stack.Screen
        name="assignOrdersDriver"
        options={{
          headerShown: false,
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="lookupOrder"
        options={{
          headerShown: false,
          gestureEnabled: true,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack>
  );
}
