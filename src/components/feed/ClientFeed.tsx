'use client';

import { useState, useRef, useEffect } from 'react';
import VideoPlayer, { type Video } from './VideoPlayer';

export default function ClientFeed({ initialVideos }: { initialVideos: Video[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollPosition = container.scrollTop;
            const height = container.clientHeight;
            const newIndex = Math.round(scrollPosition / height);
            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [activeIndex]);

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
            {initialVideos.map((video, index) => (
                <VideoPlayer
                    key={video.id}
                    video={video}
                    isActive={index === activeIndex}
                />
            ))}
        </div>
    );
}
