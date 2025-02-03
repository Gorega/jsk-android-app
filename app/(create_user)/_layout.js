import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";

export default function RootLayout(){
  const { userId } = useLocalSearchParams();

return <Stack>
  <Stack.Screen name="index" options={{title: userId ? `Edit User #${userId}` : "Create User"}} />
</Stack>

}