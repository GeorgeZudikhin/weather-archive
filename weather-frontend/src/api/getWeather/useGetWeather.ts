import { useQuery } from "@tanstack/react-query";
import { getWeather } from "./getWeather";

export default function useGetWeather(topic: string, date: string, hour: number) {
    console.log("API called")
    return useQuery({
        queryKey: ['availableVideos', topic],
        queryFn: () => getWeather(topic, date, hour),
    })
}