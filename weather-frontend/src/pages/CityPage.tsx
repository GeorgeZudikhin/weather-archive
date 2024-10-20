import { cities } from "@/types/cities";
import { useState } from "react";
import DatePicker from "react-datepicker";
import Slider from "react-slider";
import { useParams, useNavigate } from "react-router-dom";
import Video from "@/components/Video";
import Plot from "@/components/Plot";
import "@/styles/slider.css";

export default function CityPage() {
    const { cityValue } = useParams<{ cityValue: string }>();
    const navigate = useNavigate();

    const selectedCity = cities.find((city) => city.value === cityValue);

    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedHour, setSelectedHour] = useState<number>(12);

    return (
        <>
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 left-6 rounded-lg border-zinc-400"
            >
                Go Back
            </button>
            <div className="p-6 space-y-6">
                <h1 className="text-4xl font-bold text-center">
                    {selectedCity?.label}
                </h1>

                <Video />
                <Plot />

                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="px-4 py-2 border rounded-md text-center w-40"
                />

                <div className="flex flex-col items-center space-y-2">
                    <p className="font-semibold">
                        Selected Hour: {selectedHour}:00
                    </p>
                    <Slider
                        className="w-64 h-5 react-slider"
                        min={0}
                        max={23}
                        step={1}
                        value={selectedHour}
                        onChange={(value) => setSelectedHour(value)}
                        thumbClassName="thumb"
                        trackClassName="track"
                        renderThumb={(props, state) => (
                            <div
                                {...props}
                                className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            >
                                {state.valueNow}
                            </div>
                        )}
                    />
                </div>
            </div>
        </>
    );
}
