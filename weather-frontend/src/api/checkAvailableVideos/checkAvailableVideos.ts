import { AxiosResponse } from "axios";
import { apiClient } from "../api";

export interface AvailableVideos {
    dates: Array<{
      date: string; 
      hours: number[]; 
    }>;
  }  

export default async function checkAvailableVideos (topic: string): Promise<AvailableVideos> {
    const response: AxiosResponse<AvailableVideos> = await apiClient.get<AvailableVideos>(
        `/checkAvailableVideos?topic=${topic}`,
    );
    return response.data;
};