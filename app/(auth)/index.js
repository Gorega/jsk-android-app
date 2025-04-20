import { Alert, StyleSheet,Text, TouchableOpacity } from "react-native";
import Sign from "../../components/sign/Sign";
import { Link, useRouter,Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../_layout";
import { saveToken,getToken } from "../../utils/secureStore";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';


export default function HomeScreen(){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { language } = useLanguage();
    const { isAuthenticated,setIsAuthenticated,setUserId } = useAuth();


    const [loginForm,setLoginForm] = useState({
        phone:"",
        password:""
    })

    const [formErrors, setFormErrors] = useState({
        phone: "",
        password: ""
    });


    const fields = [{
        name: "phone",
        label: translations[language].auth.mobileNumber,
        type: "input",
        value: loginForm.phone,
        error: formErrors.phone || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, phone: ""}));
            setLoginForm(prev => ({...prev, phone: value}));
        }
    }, {
        name: "password",
        label: translations[language].auth.password,
        type: "input",
        value: loginForm.password,
        error: formErrors.password || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, password: ""}));
            setLoginForm(prev => ({...prev, password: value}));
        }
    }];

    const loginHandler = async () => {
        try {
            setFormErrors({});
            setLoading(true);
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
                method: "POST",
                body: JSON.stringify({
                    phone: loginForm.phone,
                    password: loginForm.password
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': language
                },
                credentials: "include"
            });
            const data = await response.json();
            
            if (!response.ok) {
                if (data.type === 'VALIDATION_ERROR') {
                    const errors = {};
                    data.details.forEach(error => {
                        errors[error.field] = error.message;
                    });
                    setFormErrors(errors);
                }
                throw new Error(data.message);
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
            Alert.alert(
                translations[language].auth.loginFailed,
                err.message
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await getToken("userToken");
                if (token) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();
    }, [setIsAuthenticated]);
    
    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Sign
        fields={fields}
        submit={{
            label:translations[language].auth.login,
            action:loginHandler,
            loading: loading
        }}
        error={error}
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