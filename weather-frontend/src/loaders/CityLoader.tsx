import useCheckAvailableVideos from "@/api/checkAvailableVideos/useCheckAvailableVideos";
import NoVideosAvailable from "@/components/NoVideosAvailable";
import CityPage from "@/pages/CityPage";
import { CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";

export default function CityLoader() {
    const { cityValue } = useParams<{ cityValue: string }>();
    const { data, isLoading } = useCheckAvailableVideos(cityValue!);

    if (isLoading) return <CircularProgress />;

    if (!data?.dates || !Array.isArray(data.dates) || data.dates.length === 0) {
        console.log("no videos available");
        return <NoVideosAvailable />;
    }

    return <CityPage cityValue={cityValue!} availableVideos={data} />;
}
