import { AxiosResponse } from "axios";
import { apiClient } from "../api";

export interface VideoResponse {
  video_url: string | null;
  images: Array<{
    timestamp: string;
    temperature: number;
    humidity: number;
    air_pressure: number;
  }>;
}

export async function getWeather(topic: string, date: string, hour: number): Promise<VideoResponse> {
  const response: AxiosResponse<VideoResponse> = await apiClient.get<VideoResponse>(
          `/getVideo?topic=${topic}&date=${date}&hour=${hour}`,
      );
  return response.data;
}
