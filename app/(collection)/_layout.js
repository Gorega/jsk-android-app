import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";

export default function RootLayout(){
  const { type } = useLocalSearchParams();

return <Stack>
  <Stack.Screen name="index" options={{title:`${type} Collections`}} />
</Stack>

}