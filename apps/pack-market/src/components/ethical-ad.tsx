"use client";

import { useEffect, useRef } from "react";

/**
 * EthicalAds placement component.
 *
 * Renders an ad from the EthicalAds network (https://ethicalads.io).
 * Privacy-first: no cookies, no tracking, no personal data collection.
 *
 * To set up:
 * 1. Register at https://ethicalads.io/publishers/
 * 2. Set NEXT_PUBLIC_ETHICAL_AD_PUBLISHER env var to your publisher ID
 * 3. The component auto-loads the EthicalAds script and renders a placement
 *
 * Falls back to a sponsorship CTA if no publisher ID is configured.
 */

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ETHICAL_AD_PUBLISHER;
const SCRIPT_URL = "https://media.ethicalads.io/media/client/ethicalads.min.js";

export function EthicalAd({
  type = "image",
  className,
}: {
  type?: "image" | "text";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!PUBLISHER_ID) return;
    if (scriptLoaded.current) return;

    // Check if script already exists
    if (!document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
    scriptLoaded.current = true;
  }, []);

  // If no publisher ID configured, show sponsorship CTA
  if (!PUBLISHER_ID) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-border/30 bg-card/20 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/30">
            Sponsor
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground/50">
            Help keep Ambrosia Pack free and open source.
          </p>
          <a
            href="https://github.com/sponsors/unmake"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-block rounded-md bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Become a sponsor
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={className} ref={containerRef}>
      <div
        className="ea-placement"
        data-ea-publisher={PUBLISHER_ID}
        data-ea-type={type}
        data-ea-style="stickybox"
      />
      <p className="mt-1.5 text-[9px] text-muted-foreground/25">
        ads via EthicalAds · privacy-first, no tracking
      </p>
    </div>
  );
}
