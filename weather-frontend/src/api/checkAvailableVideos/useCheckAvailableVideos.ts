import { useQuery } from "@tanstack/react-query";
import checkAvailableVideos from "./checkAvailableVideos";

export default function useCheckAvailableVideos(topic: string) {
    console.log("API called")
    return useQuery({
        queryKey: ['availableVideos', topic],
        queryFn: () => checkAvailableVideos(topic),
    })
}