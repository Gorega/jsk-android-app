import Sign from "@/components/sign/Sign";
import { useEffect, useState } from "react";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';
import { Alert } from "react-native";
import { router } from "expo-router";

export default function Login(){

    const [cities,setCities] = useState([]);
    const { language } = useLanguage();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formErrors, setFormErrors] = useState({
        username: "",
        comercial_name:"",
        phone: "",
        email: "",
        role: "",
        city: "",
        area: "",
        address: "",
        password: ""
    });

    const [selectedValue,setSelectedValue] = useState({
        role:"",
        city:""
    });

    const [registerForm,setRegisterForm] = useState({
        username:"",
        comercial_name:"",
        phone:"",
        email:null,
        city:"",
        area:"",
        address:"",
        password:""
    })

    const fields = [{
        name: "username",
        label: translations[language].auth.username,
        type: "input",
        value: registerForm.username,
        error: formErrors.name || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, name: ""}));
            setRegisterForm(prev => ({...prev, username: value}));
        }
    },{
        name: "comercial_name",
        label: translations[language].auth.comercialName,
        type: "input",
        value: registerForm.comercial_name,
        error: formErrors.comercial_name || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, comercial_name: ""}));
            setRegisterForm(prev => ({...prev, comercial_name: value}));
        }
    },{
        name: "phone",
        label: translations[language].auth.mobileNumber,
        type: "input",
        value: registerForm.phone,
        error: formErrors.phone || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, phone: ""}));
            setRegisterForm(prev => ({...prev, phone: value}));
        }
    }, {
        name: "email",
        label: translations[language].auth.email,
        type: "input",
        value: registerForm.email,
        error: formErrors.email,
        onChange: (value) => {
            setFormErrors(prev => ({...prev, email: ""}));
            setRegisterForm(prev => ({...prev, email: value}));
        }
    }, {
        name: "role",
        label: translations[language].auth.role.title,
        type: "select",
        value: selectedValue.role?.label || "",
        error: formErrors.role_id || "",
        list: [{
            label: translations[language].auth.role.business,
            value: 2
        }, {
            label: translations[language].auth.role.driver,
            value: 4
        }],
        onSelect: () => setFormErrors(prev => ({...prev, role_id: ""}))
    }, {
        name: "city",
        label: translations[language].auth.city,
        type: "select",
        value: selectedValue.city?.label || "",
        error: formErrors.city_id || "",
        list: cities?.map(city => ({
            label: city.name,
            value: city.city_id
        })),
        onSelect: () => setFormErrors(prev => ({...prev, city_id: ""}))
    }, {
        name: "area",
        label: translations[language].auth.area,
        type: "input",
        value: registerForm.area,
        error: formErrors.area || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, area: ""}));
            setRegisterForm(prev => ({...prev, area: value}));
        }
    }, {
        name: "address",
        label: translations[language].auth.address,
        type: "input",
        value: registerForm.address,
        error: formErrors.address || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, address: ""}));
            setRegisterForm(prev => ({...prev, address: value}));
        }
    }, {
        name: "password",
        label: translations[language].auth.password,
        type: "input",
        value: registerForm.password,
        error: formErrors.password || "",
        onChange: (value) => {
            setFormErrors(prev => ({...prev, password: ""}));
            setRegisterForm(prev => ({...prev, password: value}));
        }
    }];

    const registerHandler = async ()=>{
        setLoading(true);
        setError('');
        setFormErrors({});
        
        try{
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users`,{
                method:"POST",
                credentials:"include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                    'Accept-Language': language
                },
                body:JSON.stringify({
                    name:registerForm.username,
                    comercial_name:registerForm.comercial_name,
                    email:registerForm.email,
                    phone:registerForm.phone,
                    password:registerForm.password,
                    role_id:selectedValue?.role.value,
                    manager_id:null,
                    affiliator:null,
                    branch_id:null,
                    pricelist_id:2,
                    country: "palestine",
                    city_id:selectedValue?.city.value,
                    area:registerForm.area,
                    address:registerForm.address,
                })
            })
            const data = await res.json();
            if (!res.ok) {
                if (data.type === 'VALIDATION_ERROR') {
                    const errors = {};
                    data.details.forEach(error => {
                        errors[error.field] = error.message;
                    });
                    setFormErrors(errors);
                }
                throw new Error(data.message);
            }

            // Handle successful registration
            Alert.alert(
                "",
                translations[language].auth.registerSuccess,
                [{ text: "OK", onPress: () => router.replace("/") }]
            );
        }catch (err) {
            Alert.alert(
                translations[language].auth.registrationFailed,
                err.message
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(()=>{
        const fetchCities = async ()=>{
            try{
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/addresses/cities?language_code=${language}`,{
                    credentials:"include",
                    method:"GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });
                const data = await res.json();
                setCities(data.data);
            }catch(err){
            }
        }
        fetchCities();
    },[])

    return <Sign 
        fields={fields}
        submit={{
            label:translations[language].auth.register,
            action:registerHandler,
            loading: loading
        }}
        setSelectedValue={setSelectedValue}
        error={error}
    />
}