import axios from "axios";

const API = axios.create({
    baseURL: "https://cloud-bill-manager.vercel.app/api/v1/organization/",
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json'
      }
});

export {API}