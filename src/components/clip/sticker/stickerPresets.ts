import stickerBird from "../../../assets/sticker/sticker_bird.png";
import stickerGugugaga from "../../../assets/sticker/sticker_gugugaga.png";
import stickerShaker from "../../../assets/sticker/sticker_shaker.png";
import stickerTortoise from "../../../assets/sticker/sticker_tortoise.png";

export type StickerPreset = {
  id: string;
  label: string;
  src: string;
};

export const STICKER_PRESETS: StickerPreset[] = [
  { id: "bird", label: "Bird", src: stickerBird },
  { id: "gugugaga", label: "Gugugaga", src: stickerGugugaga },
  { id: "shaker", label: "Shaker", src: stickerShaker },
  { id: "tortoise", label: "Tortoise", src: stickerTortoise },
];
