import Metadata from "@/types/Metadata";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface PlotProps {
    data: Metadata[];
}

export default function Plot({ data }: Readonly<PlotProps>) {
    if (!data.length) {
        return (
            <div className="flex justify-center items-center w-96 h-64 bg-gray-200 rounded-lg">
                <p className="text-gray-500">
                    [No plot data yet, pick date and hour!]
                </p>
            </div>
        );
    }

    const totalEntries = data.length;
    const totalTemperature = data.reduce(
        (sum, entry) => sum + entry.temperature,
        0,
    );
    const totalHumidity = data.reduce((sum, entry) => sum + entry.humidity, 0);
    const totalAirPressure = data.reduce(
        (sum, entry) => sum + entry.air_pressure,
        0,
    );

    const avgTemperature = (totalTemperature / totalEntries).toFixed(2);
    const avgHumidity = (totalHumidity / totalEntries).toFixed(2);
    const avgAirPressure = (totalAirPressure / totalEntries).toFixed(2);

    const averageData = [
        {
            temperature: avgTemperature,
            humidity: avgHumidity,
            air_pressure: avgAirPressure,
        },
    ];

    return (
        <div className="w-full">
            <BarChart
                width={400}
                height={300}
                data={averageData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="average" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="temperature" fill="#8884d8" name="Temperature" />
                <Bar dataKey="humidity" fill="#82ca9d" name="Humidity" />
                <Bar
                    dataKey="air_pressure"
                    fill="#ffc658"
                    name="Air Pressure"
                />
            </BarChart>
        </div>
    );
}
