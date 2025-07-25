import { TouchableOpacity, Text, View, Platform } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from "expo-router";
import { useRTLStyles } from "../utils/RTLWrapper";
import { useTheme } from '@/utils/themeContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FixedHeader({children, title, showBackButton=true}){
    const rtl = useRTLStyles();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    return (
        <View style={{
            height: Platform.OS === 'ios' ? 100 + insets.top : 100,
            backgroundColor: colors.card,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                },
                android: {
                    elevation: 4,
                },
            }),
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingHorizontal: 15,
            paddingBottom: 15,
            paddingTop: insets.top,
        }}>
            <View style={{flexDirection: "row", alignItems: "center", gap: 15}}>
                {showBackButton && (
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons 
                            name={rtl.isRTL ? "arrow-forward" : "arrow-back"} 
                            size={24} 
                            color={colors.iconDefault} 
                        />
                    </TouchableOpacity>
                )}
                <Text style={{fontSize: 18, fontWeight: "500", color: colors.text}}>{title}</Text>
            </View>
            {children}
        </View>
    );
}