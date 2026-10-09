"use client";

import styles from "./CinematicAtmosphere.module.css";

/**
 * Optical foreground for UMBRAL's four photographed rooms.
 * Every highlight, particle and shadow is resolution-independent CSS:
 * no stretched raster overlays and no animation frame loop on phones.
 * It never handles pointer events or changes the position of clues.
 */
const motes = Array.from({ length: 24 }, (_, index) => ({
  x: (index * 47 + 13) % 97,
  y: (index * 31 + 9) % 87,
  delay: -((index * 13) % 41) / 4,
  duration: 9 + ((index * 7) % 17),
  size: index % 5 === 0 ? 2 : 1,
}));

const streaks = Array.from({ length: 22 }, (_, index) => ({
  x: (index * 41 + 4) % 100,
  delay: -((index * 11) % 47) / 13,
  duration: 2.2 + ((index * 3) % 9) / 7,
  length: 33 + ((index * 13) % 61),
}));

export default function CinematicAtmosphere({
  room, powered, paused,
}: { room: number; powered: boolean; paused: boolean }) {
  return (
    <div
      className={styles.atmosphere}
      data-testid="umbral-atmosphere"
      data-mood={["foyer","study","nursery","machine"][room] ?? "foyer"}
      data-powered={powered ? "yes" : "no"}
      data-paused={paused ? "yes" : "no"}
      aria-hidden="true"
    >
      <div className={styles.colorGrade} />
      <div className={styles.windowGlow} />
      <div className={styles.volume}>
        <i className={styles.shaftOne} />
        <i className={styles.shaftTwo} />
        <i className={styles.shaftThree} />
      </div>
      <div className={styles.practical} />
      <div className={styles.windowRain}>
        {streaks.map((streak,index) => (
          <i key={index} style={{
            left: streak.x+"%",
            top: ((index*17)%73)+"%",
            height: streak.length+"px",
            animationDelay: streak.delay+"s",
            animationDuration: streak.duration+"s",
          }} />
        ))}
      </div>
      <div className={styles.suspendedDust}>
        {motes.map((mote,index) => (
          <i key={index} style={{
            left: mote.x+"%",
            top: mote.y+"%",
            width: mote.size+"px",
            height: mote.size+"px",
            animationDelay: mote.delay+"s",
            animationDuration: mote.duration+"s",
          }} />
        ))}
      </div>
      <div className={styles.anamorphicGlass} />
      <div className={styles.falloff} />
    </div>
  );
}
