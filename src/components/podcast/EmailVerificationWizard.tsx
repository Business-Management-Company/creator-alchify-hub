import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Loader2, Check } from "lucide-react";

interface EmailVerificationWizardProps {
  podcastId: string;
  podcastSlug?: string;
  currentEmail?: string;
  currentExpiration?: string;
  currentPermanent?: boolean;
  onComplete: () => void;
}

export const EmailVerificationWizard = ({
  podcastId,
  podcastSlug,
  currentEmail,
  currentExpiration,
  currentPermanent,
  onComplete,
}: EmailVerificationWizardProps) => {
  const [email, setEmail] = useState(currentEmail || "");
  const [loading, setLoading] = useState(false);
  const [permanent, setPermanent] = useState(currentPermanent || false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // Placeholder for email verification API call
      console.log("Submitting verification email:", {
        podcastId,
        email,
        permanent,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(
        permanent
          ? "Email verified permanently!"
          : "Verification link sent to your email (valid for 48 hours)"
      );
      setSubmitted(true);

      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to submit verification email");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 p-3 rounded-full bg-green-500/10">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Email Verification Submitted</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {permanent
            ? "Your email has been verified and is now permanent for this podcast."
            : "A verification link has been sent to your email. Check your inbox!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground">
          Verify your email to submit your podcast to Spotify, Apple Podcasts, and other directories.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium">Make verification permanent</span>
          </Label>
          <p className="text-xs text-muted-foreground ml-7">
            {permanent
              ? "This email will be verified indefinitely for your podcast."
              : "Verification will expire in 48 hours. You'll need to re-verify after that."}
          </p>
        </div>

        {currentExpiration && !currentPermanent && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Current verification expires on{" "}
              {new Date(currentExpiration).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onComplete}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Verify Email
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        We'll never share your email with third parties. Your podcast ID: {podcastId}
      </p>
    </div>
  );
};
