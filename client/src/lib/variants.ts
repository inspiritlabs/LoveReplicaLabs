import { Variants } from "framer-motion";

export const fadeSlide: Variants = {
  hidden:  { opacity: 0, y: 12, pointerEvents: "none" },
  visible: { opacity: 1, y: 0,  pointerEvents: "auto",
             transition: { duration: .35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -12, pointerEvents: "none",
             transition: { duration: .25, ease: [0.4, 0, 0.2, 1] } }
};