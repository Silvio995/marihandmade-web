"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";

const words = [
  "Fatto a mano",
  "Creazioni uniche",
  "Piccoli dettagli",
  "Cura artigianale",
  "MariHandmade",
];
export function ValueMarquee() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className="shop-marquee"
      aria-label="Il mondo MariHandmade"
      data-paused={paused}
    >
      <p className="sr-only">{words.join(" · ")}</p>
      <div className="shop-marquee-window" aria-hidden="true">
        <div className="shop-marquee-track">
          {[0, 1].map((copy) => (
            <div className="shop-marquee-copy" key={copy}>
              {words.map((word) => (
                <span key={word}>
                  {word}
                  <span className="shop-marquee-star">✧</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="shop-marquee-toggle shop-icon"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? "Riprendi lo scorrimento" : "Pausa scorrimento"}
        aria-pressed={paused}
      >
        {paused ? <Play size={15} /> : <Pause size={15} />}
      </button>
    </section>
  );
}
