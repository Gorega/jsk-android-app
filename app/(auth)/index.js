import { StyleSheet,Text, TouchableOpacity } from "react-native";
import Sign from "../../components/sign/Sign";
import { Link, useRouter,Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../_layout";
import { saveToken,getToken } from "../../utils/secureStore";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';


export default function HomeScreen(){
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { language } = useLanguage();
    const { isAuthenticated,setIsAuthenticated,setUserId } = useAuth();


    const [loginForm,setLoginForm] = useState({
        phone:"",
        password:""
    })

    const fields = [{
        name:"phone",
        label:translations[language].auth.mobileNumber,
        type:"input",
        value:loginForm.phone,
        onChange:(value)=> setLoginForm((loginForm)=> ({...loginForm,phone:value}))
    },{
        name:"password",
        label:translations[language].auth.password,
        type:"input",
        value:loginForm.password,
        onChange:(value)=> setLoginForm((loginForm)=> ({...loginForm,password:value}))
    }]

    const loginHandler = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
                method: "POST",
                body: JSON.stringify({
                    phone: loginForm.phone,
                    password: loginForm.password
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: "include"
            });
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.userId) {
                await saveToken("userId", data.userId.toString());
                setUserId(data.userId);
            }
            
            if (data.token) {
                console.log("Saving token:", data.token);
                await saveToken("userToken", data.token);
                
                const savedToken = await getToken("userToken");
                console.log("Verified saved token:", data.token);
                
                setIsAuthenticated(true);
                router.replace("/(tabs)");
            } else {
                throw new Error('No token received');
            }
        } catch (err) {
            console.error('Login error:', err);
            Alert.alert("Login Failed", err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await getToken("userToken");
                if (token) {
                    console.log("Token found in HomeScreen:", token);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Error checking auth:", error);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    if (loading) {
        return null;
    }

    return <Sign
        fields={fields}
        submit={{
            label:translations[language].auth.login,
            action:loginHandler
        }}
    >
        <Link style={styles.bottomLine} href={"/sign-up"} asChild>
            <TouchableOpacity>
                <Text style={styles.line}>{translations[language].auth.dontHaveAccount}</Text>
                <Text style={styles.line}>{translations[language].auth.register}</Text>
            </TouchableOpacity>
        </Link>
    </Sign>
}

const styles = StyleSheet.create({
    bottomLine:{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
    }
})