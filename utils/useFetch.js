import { useState } from "react";

export default function useFetch(){
    const [data,setData] = useState([]);

    const getRequest = async (url)=>{
        try{
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${url}`,{
              method:"GET",
              credentials:"include",
              headers: {
                  'Accept': 'application/json',
                  "Content-Type": "application/json"
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