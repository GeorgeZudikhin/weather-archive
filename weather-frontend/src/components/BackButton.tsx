import { useNavigate } from "react-router-dom";

export default function BackButton() {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 rounded-lg border-zinc-400"
        >
            Go Back
        </button>
    );
}
