import { useEffect } from "react";
import { useParams } from "react-router-dom";

/**
 * This route acts as a redirect proxy for /feed/:podcastId
 * It redirects the browser (or podcast aggregator) to the actual edge function URL.
 */
const RssFeedProxy = () => {
  const { podcastId } = useParams<{ podcastId: string }>();

  useEffect(() => {
    if (podcastId) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const feedUrl = `${supabaseUrl}/functions/v1/generate-rss?id=${podcastId}`;
      window.location.replace(feedUrl);
    }
  }, [podcastId]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to RSS feed...</p>
    </div>
  );
};

export default RssFeedProxy;
