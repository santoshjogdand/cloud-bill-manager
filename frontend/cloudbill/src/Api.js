import axios from "axios";

const API = axios.create({
    baseURL: "http://cloud-bill-manager.onrender.com/api/v1/organization/",
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json'
      }
});

export {API}