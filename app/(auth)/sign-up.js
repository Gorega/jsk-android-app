import Sign from "@/components/sign/Sign";
import { useEffect, useState } from "react";
import { useLanguage } from '../../utils/languageContext';
import { translations } from '../../utils/languageContext';

export default function Login(){

    const [cities,setCities] = useState([]);
    const { language } = useLanguage();

    const [selectedValue,setSelectedValue] = useState({
        role:"",
        city:""
    });

    const [registerForm,setRegisterForm] = useState({
        username:"",
        phone:"",
        email:"",
        city:"",
        area:"",
        address:"",
        password:""
    })

    const fields = [{
        name:"username",
        label:translations[language].auth.username,
        type:"input",
        value:registerForm.username,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,username:value}))
    },{
        name:"phone",
        label:translations[language].auth.mobileNumber,
        type:"input",
        value:registerForm.phone,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,phone:value}))
    },{
        name:"email",
        label:translations[language].auth.email,
        type:"input",
        value:registerForm.email,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,email:value}))
    },{
        name:"role",
        label:translations[language].auth.role,
        type:"select",
        value:selectedValue.role.label,
        list: [{
            label:"Business",
            value:"business"
        },{
            label:"Driver",
            value:"driver"
        }]
    },{
        name:"city",
        label:translations[language].auth.city,
        type:"select",
        value:selectedValue.city.label,
        list:cities?.map(city=> ({
            label:city.city_name,
            value:city.city_id
        }))
    },{
        name:"area",
        label:translations[language].auth.area,
        type:"input",
        value:registerForm.area,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,area:value}))
    },{
        name:"address",
        label:translations[language].auth.address,
        type:"input",
        value:registerForm.address,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,address:value}))
    },{
        name:"password",
        label:translations[language].auth.password,
        type:"input",
        value:registerForm.password,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,password:value}))
    }]

    const registerHandler = async ()=>{
        try{
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users`,{
                method:"POST",
                credentials:"include",
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json",
                },
                body:JSON.stringify({
                    name:registerForm.username,
                    email:registerForm.email,
                    phone:registerForm.phone,
                    password:registerForm.password,
                    role_id:1,
                    affiliator:null,
                    branch_id:null,
                    country:"palestine",
                    city_id:selectedValue?.city.value,
                    area:registerForm.area,
                    address:registerForm.address,
                })
            })
            const data = await res.json();
            console.log(data)
        }catch(err){
            console.log(err)
        }
    }

    useEffect(()=>{
        const fetchCities = async ()=>{
            try{
                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/addresses/cities`,{
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
                console.log(err)
            }
        }
        fetchCities();
    },[])

    return <Sign 
        fields={fields}
        submit={{
            label:translations[language].auth.register,
            action:registerHandler
        }}
        setSelectedValue={setSelectedValue}
    />
}