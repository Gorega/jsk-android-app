import { Stack } from "expo-router";
import { useLocalSearchParams } from "expo-router";

export default function RootLayout(){
  const { orderId } = useLocalSearchParams();

return <Stack>
  <Stack.Screen name="index" options={{title: orderId ? `Edit Order #${orderId}` : "Create Order"}} />
</Stack>

}