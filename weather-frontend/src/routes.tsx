import { createBrowserRouter } from "react-router-dom";
import CityPage from "@/pages/CityPage";
import ErrorPage from "@/pages/ErrorPage";
import WeatherArchiveAppPage from "@/pages/WeatherArchiveAppPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <WeatherArchiveAppPage />,
        errorElement: <ErrorPage />,
    },
    {
        path: "cities/:cityValue",
        element: <CityPage />,
    },
]);
