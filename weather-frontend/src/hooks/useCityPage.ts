import axios from "axios";

export default async function useCityPage() {
    const { data } = await axios.get("/checkAvailableVideos?topic=Vienna");
    console.log(data);
}