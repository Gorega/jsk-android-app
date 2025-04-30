import { Stack } from "expo-router";
import Header from "../../components/Header";

export default function RootLayout(){

return <Stack>
  <Stack.Screen name="index" options={{
    title:"index",
    header:()=>{
        return <Header />
      },
    }} />
</Stack>

}