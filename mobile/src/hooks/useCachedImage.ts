import { useEffect, useRef, useState } from "react";

import { imageCache } from "../services/imageCache";

interface CachedImageState {
  localUri: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Resolves a remote image URL to a locally cached file:// path.
 * Downloads the image on first use; returns the cached path instantly on repeat visits.
 */
export function useCachedImage(remoteUrl: string | undefined): CachedImageState {
  const [state, setState] = useState<CachedImageState>({
    localUri: null,
    isLoading: !!remoteUrl,
    error: null,
  });

  // Track whether the component is still mounted
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!remoteUrl) {
      setState({ localUri: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    imageCache
      .getOrCache(remoteUrl)
      .then((localUri) => {
        if (!cancelled && mountedRef.current) {
          setState({ localUri, isLoading: false, error: null });
        }
      })
      .catch((err) => {
        if (!cancelled && mountedRef.current) {
          setState({
            localUri: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [remoteUrl]);

  return state;
}
