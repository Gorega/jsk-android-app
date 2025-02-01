import { TouchableOpacity, Text } from "react-native";
import {deleteToken} from "../../utils/secureStore";

export default function Settings(){
    return <TouchableOpacity onPress={()=> deleteToken("userToken")}>
        <Text>Sign out</Text>
    </TouchableOpacity>
}