import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * Exports are managed in Media Library (Library page, Exports tab).
 * This route exists so the sidebar "Exports" link does not 404.
 */
const Exports = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/library", { replace: true });
  }, [navigate]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Download className="h-10 w-10 text-muted-foreground animate-pulse" />
        <p className="text-muted-foreground">Taking you to Media Library…</p>
        <Button variant="link" onClick={() => navigate("/library")}>
          Go to Media Library
        </Button>
      </div>
    </AppLayout>
  );
};

export default Exports;
