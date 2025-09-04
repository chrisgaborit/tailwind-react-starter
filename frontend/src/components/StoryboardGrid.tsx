// src/components/StoryboardGrid.tsx
import React from "react";

type AnyScene = {
  id?: string | number;
  sceneNumber?: number;
  sceneTitle?: string;
  visualDescription?: string;
  imageUrl?: string | null;
  visual?: {
    generatedImageUrl?: string | null;
  } | null;
};

interface StoryboardGridProps {
  scenes: AnyScene[];
  onSelect?: (scene: AnyScene, index: number) => void;
  className?: string;
  columns?: number; // e.g. 3/4; defaults responsive
}

const StoryboardGrid: React.FC<StoryboardGridProps> = ({
  scenes,
  onSelect,
  className = "",
  columns,
}) => {
  const colClasses =
    columns && columns > 0
      ? `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.max(
          2,
          columns
        )} gap-4`
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

  return (
    <div className={`${colClasses} ${className}`}>
      {scenes.map((scene, idx) => {
        const preferredUrl =
          (scene.imageUrl && scene.imageUrl.trim()) ||
          (scene.visual?.generatedImageUrl &&
            scene.visual.generatedImageUrl.trim()) ||
          "";
        const fallbackUrl = `https://picsum.photos/seed/${
          scene.id || scene.sceneNumber || idx
        }/520/300`;
        const imgSrc = preferredUrl || fallbackUrl;

        return (
          <button
            key={String(scene.id ?? idx)}
            type="button"
            onClick={() => onSelect?.(scene, idx)}
            className="group text-left bg-slate-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label={
              scene.sceneTitle
                ? `Open ${scene.sceneTitle}`
                : `Open Scene ${scene.sceneNumber ?? idx + 1}`
            }
          >
            <div className="relative">
              <img
                src={imgSrc}
                alt={
                  scene.sceneTitle
                    ? `Thumbnail for ${scene.sceneTitle}`
                    : `Thumbnail for Scene ${scene.sceneNumber ?? idx + 1}`
                }
                className="w-full h-36 object-cover"
                crossOrigin="anonymous"
                loading="lazy"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.src = "https://picsum.photos/520/300?grayscale&blur=1";
                }}
              />
              <div className="absolute top-2 left-2">
                <span className="text-xs font-semibold inline-block py-1 px-2 rounded-full text-emerald-100 bg-emerald-600/90 backdrop-blur">
                  #{scene.sceneNumber ?? idx + 1}
                </span>
              </div>
            </div>

            <div className="p-3">
              <h4 className="text-slate-100 text-sm font-semibold line-clamp-1">
                {scene.sceneTitle || `Scene ${scene.sceneNumber ?? idx + 1}`}
              </h4>
              {scene.visualDescription && (
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                  {scene.visualDescription}
                </p>
              )}

              <div className="mt-2 text-xs text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                View details →
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StoryboardGrid;