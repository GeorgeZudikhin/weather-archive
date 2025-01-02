import useCitySearch from "@/hooks/useCitySearch";
import { cities } from "@/types/cities";
import Select from "react-select";
import Button from "@mui/material/Button";
import Header from "../components/Header";
import "@/App.css";

export default function CitySearch() {
    const { onSubmit, handleCityChange, selectedCity } = useCitySearch();

    return (
        <>
            <Header />
            <form onSubmit={onSubmit}>
                <div className="flex flex-col gap-6 items-center">
                    <div className="w-full">
                        <Select
                            className="mb"
                            options={cities.map((city) => ({
                                value: city.value,
                                label: city.label,
                            }))}
                            placeholder="Choose your city"
                            onChange={handleCityChange}
                            isClearable
                        />
                    </div>
                    <div className="w-1/4">
                        <Button
                            variant="contained"
                            disabled={!selectedCity?.value}
                            type="submit"
                        >
                            Search
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}
