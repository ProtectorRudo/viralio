"use client";

import CoupleGiftIntro from "./CoupleGiftIntro";
import "./BirthdayGiftIntro.css";

type BirthdayGiftIntroProps = React.ComponentProps<typeof CoupleGiftIntro>;

/**
 * Cumpleaños shares the proven satin-gift interaction with Pareja,
 * but its visual direction and editorial atmosphere are entirely scoped.
 * All text is supplied by the reusable experience model.
 */
export default function BirthdayGiftIntro(props: BirthdayGiftIntroProps) {
  return (
    <div className="birthday-gift-wrap" data-birthday-gift="opening">
      <CoupleGiftIntro {...props} />
    </div>
  );
}
