import { AvailableVideos } from "@/api/checkAvailableVideos/checkAvailableVideos";
import { getWeather } from "@/api/getWeather/getWeather";
import BackButton from "@/components/BackButton";
import Plot from "@/components/Plot";
import Video from "@/components/Video";
import Metadata from "@/types/Metadata";
import {
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
} from "@mui/material";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Dayjs } from "dayjs";
import { useMemo, useState } from "react";

interface CityPageProps {
    cityValue: string;
    availableVideos: AvailableVideos;
}

export default function CityPage({
    cityValue,
    availableVideos,
}: Readonly<CityPageProps>) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [imagesMetadata, setImagesMetadata] = useState<Metadata[]>([]);
    const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
    console.log(JSON.stringify(availableVideos));

    const availableDateStrings = useMemo(() => {
        if (!availableVideos?.dates) return [];
        return availableVideos.dates.map((d) => d.date);
    }, [availableVideos]);

    const hoursForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = selectedDate.format("YYYY-MM-DD");
        const found = availableVideos.dates.find((d) => d.date === dateStr);
        return found?.hours ?? [];
    }, [selectedDate, availableVideos.dates]);

    const shouldDisableDate = (day: Dayjs) => {
        const dayStr = day.format("YYYY-MM-DD");
        return !availableDateStrings.includes(dayStr);
    };

    const selectedDateStr = selectedDate
        ? selectedDate.format("YYYY-MM-DD")
        : undefined;

    const handleFindVideo = async () => {
        setIsWeatherLoading(true);
        const response = await getWeather(
            cityValue,
            selectedDateStr!,
            selectedHour!,
        );
        console.log(JSON.stringify(response));
        if (!response) return;
        setIsWeatherLoading(false);
        setVideoUrl(response.video_url ?? null);
        setImagesMetadata(
            response.imagesMetadata.map((item) => ({
                ...item,
                temperature: Number(item.temperature),
                humidity: Number(item.humidity),
                air_pressure: Number(item.air_pressure),
            })),
        );
    };

    return (
        <>
            <BackButton />
            <div className="flex flex-col justify-center items-center p-6 gap-6 max-w-lg mx-auto">
                <h1 className="text-4xl font-bold text-center">{cityValue}</h1>
                {isWeatherLoading ? (
                    <CircularProgress />
                ) : (
                    <>
                        <Video videoUrl={videoUrl} />
                        <Plot data={imagesMetadata} />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <div className="w-full">
                                <FormControl fullWidth>
                                    <DemoContainer components={["DatePicker"]}>
                                        <DatePicker
                                            label="Select a Date"
                                            className="w-full"
                                            value={selectedDate}
                                            onChange={(date) => {
                                                setSelectedDate(date);
                                                setSelectedHour(null);
                                                setVideoUrl(null);
                                                setImagesMetadata([]);
                                            }}
                                            shouldDisableDate={
                                                shouldDisableDate
                                            }
                                        />
                                    </DemoContainer>
                                </FormControl>
                            </div>
                        </LocalizationProvider>
                        <FormControl variant="outlined" fullWidth>
                            <InputLabel id="select-hour-label">
                                Select an Hour
                            </InputLabel>
                            <Select
                                labelId="select-hour-label"
                                id="hour-select"
                                label="Select an Hour"
                                value={selectedHour}
                                onChange={(event) => {
                                    setSelectedHour(
                                        event.target.value as number,
                                    );
                                    setVideoUrl(null);
                                    setImagesMetadata([]);
                                }}
                                disabled={!selectedDate}
                            >
                                {hoursForSelectedDate.map((hour) => (
                                    <MenuItem key={hour} value={hour}>
                                        {hour}:00
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!selectedDate || selectedHour == null}
                            onClick={handleFindVideo}
                        >
                            {"Find"}
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}
