import { useState } from "react";
import { getToken } from "./secureStore";


export default function useFetch(){
    const [data,setData] = useState([]);

    const getRequest = async (url,language)=>{
        try{
            const token = await getToken("userToken");
            
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`,{
              method:"GET",
              credentials:"include",
              headers: {
                  'Accept': 'application/json',
                  "Content-Type": "application/json",
                  'Accept-Language': language,
                  "Cookie": token ? `token=${token}` : ""
                }
            })
            const data = await res.json();
            setData(data)
          }catch(err){
            console.log(err)
          }
    }


    return {
        getRequest,
        data
    }
}