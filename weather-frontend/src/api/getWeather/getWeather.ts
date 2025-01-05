import { AxiosResponse } from "axios";
import { apiClient } from "../api";
import Metadata from "@/types/Metadata";

export interface VideoResponse {
  video_url: string | null;
  imagesMetadata: Metadata[];
}

export async function getWeather(topic: string, date: string, hour: number): Promise<VideoResponse> {
  const response: AxiosResponse<VideoResponse> = await apiClient.get<VideoResponse>(
          `/getWeather?topic=${topic}&date=${date}&hour=${hour}`,
      );
  return response.data;
}
