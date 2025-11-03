import React, { useMemo } from "react";
import StoryboardDisplay from "../components/StoryboardDisplay";

export default function PrintPage() {
  const data = useMemo(() => {
    try {
      const b64 = (window.location.hash || "").replace(/^#/, "");
      if (!b64) return null;
      const json = atob(b64);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }, []);

  if (!data || !data.scenes || !data.scenes.length) {
    return (
      <div className="print-light" style={{ padding: 24 }}>
        <h1>Nothing to print</h1>
        <p>Storyboard data was missing or invalid.</p>
      </div>
    );
  }

  return (
    <div className="print-light" style={{ padding: 24 }}>
      <StoryboardDisplay scenes={data.scenes} meta={data.meta || {}} />
    </div>
  );
}

