import ErrorPage from "@/pages/ErrorPage";
import { createBrowserRouter } from "react-router-dom";
import CityLoader from "./loaders/CityLoader";
import CitySearch from "./pages/CitySearch";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <CitySearch />,
        errorElement: <ErrorPage />,
    },
    {
        path: "cities/:cityValue",
        element: <CityLoader />,
    },
]);
