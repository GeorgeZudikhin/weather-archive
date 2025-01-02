import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://9a76jd8ifk.execute-api.us-east-1.amazonaws.com/prod",
  headers: {
    "Content-Type": "application/json",
  },
});
