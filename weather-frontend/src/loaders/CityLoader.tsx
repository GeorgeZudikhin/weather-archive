import useCheckAvailableVideos from "@/api/checkAvailableVideos/useCheckAvailableVideos";
import CityPage from "@/pages/CityPage";
import { CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";

export default function CityLoader() {
    const { cityValue } = useParams<{ cityValue: string }>();
    const { data, isLoading } = useCheckAvailableVideos(cityValue!);

    if (isLoading) return <CircularProgress />;

    return <CityPage cityValue={cityValue!} availableVideos={data!} />;
}
