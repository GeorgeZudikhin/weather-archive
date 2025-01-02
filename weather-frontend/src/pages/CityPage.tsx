import { AvailableVideos } from "@/api/checkAvailableVideos/checkAvailableVideos";
import Plot from "@/components/Plot";
import Video from "@/components/Video";
import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select from "@mui/material/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CityPageProps {
    cityValue: string;
    availableVideos: AvailableVideos;
}

export default function CityPage({
    cityValue,
    availableVideos,
}: Readonly<CityPageProps>) {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
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

    const handleDateChange = (date: Dayjs | null) => {
        setSelectedDate(date);
        setSelectedHour(null);
    };

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 rounded-lg border-zinc-400"
            >
                Go Back
            </button>
            <div className="p-6 space-y-6">
                <h1 className="text-4xl font-bold text-center">{cityValue}</h1>
                <Video />
                <Plot />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={["DatePicker"]}>
                        <DatePicker
                            label="Select a Date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            shouldDisableDate={shouldDisableDate}
                        />
                    </DemoContainer>
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
                        onChange={(event) =>
                            setSelectedHour(event.target.value as number)
                        }
                        disabled={!selectedDate}
                    >
                        {hoursForSelectedDate.map((hour) => (
                            <MenuItem key={hour} value={hour}>
                                {hour}:00
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
        </>
    );
}
