import Sign from "@/components/sign/Sign";
import { useEffect, useState } from "react";

export default function Login(){

    const [cities,setCities] = useState([]);

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
        password:"",
        confirmPassword:""
    })

    const fields = [{
        name:"username",
        label:"Username",
        type:"input",
        value:registerForm.username,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,username:value}))
    },{
        name:"phone",
        label:"Mobile Number",
        type:"input",
        value:registerForm.phone,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,phone:value}))
    },{
        name:"email",
        label:"Email",
        type:"input",
        value:registerForm.email,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,email:value}))
    },{
        name:"role",
        label:"Role",
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
        label:"City",
        type:"select",
        value:selectedValue.city.label,
        list:cities?.map(city=> ({
            label:city.city_name,
            value:city.city_id
        }))
    },{
        name:"area",
        label:"Area",
        type:"input",
        value:registerForm.area,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,area:value}))
    },{
        name:"address",
        label:"Address",
        type:"input",
        value:registerForm.address,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,address:value}))
    },{
        name:"password",
        label:"Password",
        type:"input",
        value:registerForm.password,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,password:value}))
    },{
        name:"confirmPassword",
        label:"Confirm Password",
        type:"input",
        value:registerForm.confirmPassword,
        onChange:(value)=> setRegisterForm((registerForm)=> ({...registerForm,confirmPassword:value}))
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
            label:"Register",
            action:registerHandler
        }}
        setSelectedValue={setSelectedValue}
    />
}