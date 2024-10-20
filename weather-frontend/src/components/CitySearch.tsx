import useCitySearch from "@/hooks/useCitySearch";
import { cities } from "@/types/cities";
import Select from "react-select";

export default function CitySearch() {
    const { onSubmit, handleCityChange, selectedCity } = useCitySearch();

    return (
        <form onSubmit={onSubmit}>
            <Select
                className="mb-4"
                options={cities.map((city) => ({
                    value: city.value,
                    label: city.label,
                }))}
                placeholder="Choose your city"
                onChange={handleCityChange}
                isClearable
            />
            <button className="mt-3" disabled={!selectedCity?.value}>
                Search
            </button>
        </form>
    );
}
