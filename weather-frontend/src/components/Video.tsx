interface VideoProps {
    videoUrl: string | null;
}

export default function Video({ videoUrl }: Readonly<VideoProps>) {
    return (
        <div className="w-96 h-64 border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
            {videoUrl ? (
                <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-cover"
                />
            ) : (
                <p className="text-gray-500">
                    [No video yet, pick date and hour!]
                </p>
            )}
        </div>
    );
}
