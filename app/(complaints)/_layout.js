import { Stack } from "expo-router";

export default function RootLayout(){

return <Stack>
  <Stack.Screen name="index" options={{title:"Complaints"}} />
  <Stack.Screen name="complaint" options={{title:"Complaint"}} />
  <Stack.Screen name="open_complaint" options={{title:"Submit Complaint"}} />
</Stack>

}