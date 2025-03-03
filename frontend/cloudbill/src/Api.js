import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:443/api/v1/organization/",
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json'
      }
});

export {API}