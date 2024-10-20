import { CityOption } from "@/types/CityOption";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

interface CitySearchForm {
    city: string;
}

export default function useCitySearch() {
    const { handleSubmit } = useForm<CitySearchForm>();
    const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
    const navigate = useNavigate();

    const onSubmit: SubmitHandler<CitySearchForm> = () => {
        navigate(`/cities/${selectedCity?.value}`);
    };

    const handleCityChange = (selectedOption: CityOption | null) => {
        setSelectedCity(selectedOption);
    };

    return {
        onSubmit: handleSubmit(onSubmit),
        handleCityChange,
        selectedCity,
    };
}
