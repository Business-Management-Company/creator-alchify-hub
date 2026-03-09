import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional class for the wrapper (e.g. for aspect ratio / size). */
  wrapperClassName?: string;
  /** Optional class for the skeleton while loading. */
  skeletonClassName?: string;
}

/**
 * Renders an image with a skeleton placeholder until the image has loaded.
 * Use for images that may load slowly (e.g. podcast covers, CDN URLs).
 */
export function ImageWithLoader({
  src,
  alt,
  className,
  wrapperClassName,
  skeletonClassName,
  ...imgProps
}: ImageWithLoaderProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src) return null;

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {(!loaded || error) && (
        <Skeleton
          className={cn("absolute inset-0 w-full h-full", skeletonClassName)}
          aria-hidden
        />
      )}
      {error && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm",
            className
          )}
        >
          Image unavailable
        </div>
      )}
      {!error && (
        <img
          src={src}
          alt={alt ?? ""}
          className={cn(
            "object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          {...imgProps}
        />
      )}
    </div>
  );
}
