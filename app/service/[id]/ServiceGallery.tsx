"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, X, ZoomIn } from "lucide-react";

export function ServiceGallery({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const displayImages = images.slice(0, 6);

  const prev = () => setCurrentIndex(i => (i === 0 ? displayImages.length - 1 : i - 1));
  const next = () => setCurrentIndex(i => (i === displayImages.length - 1 ? 0 : i + 1));

  if (!displayImages.length) {
    return (
      <div className="aspect-[16/9] w-full bg-muted/50 rounded-xl flex flex-col items-center justify-center gap-3 border border-dashed border-border">
        <ImageIcon className="h-10 w-10 text-muted-foreground/25" />
        <p className="text-xs text-muted-foreground">No images uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">

        {/* Main image */}
        <div
          className="relative aspect-[16/9] w-full bg-muted rounded-xl overflow-hidden border border-border/50 group cursor-zoom-in"
          onClick={() => setLightboxOpen(true)}
        >
          <img
            src={displayImages[currentIndex]}
            alt={`Service image ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Zoom hint */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
            <ZoomIn className="h-3 w-3" /> View full size
          </div>

          {/* Counter badge */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              {currentIndex + 1} / {displayImages.length}
            </div>
          )}

          {/* Nav arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hover:bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 hover:bg-background"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative aspect-video w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200
                  ${currentIndex === idx
                    ? "border-primary scale-[1.03] shadow-md"
                    : "border-transparent opacity-55 hover:opacity-90 hover:border-border"
                  }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayImages[currentIndex]}
              alt="Full size preview"
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Lightbox thumbnails */}
                <div className="flex justify-center gap-2 mt-4">
                  {displayImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        currentIndex === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}