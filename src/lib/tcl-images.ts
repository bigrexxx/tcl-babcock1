import hero from "@/assets/hero.jpg";
import studio from "@/assets/studio.jpg";
import sports from "@/assets/c-sports.jpg";
import academic from "@/assets/c-academic.jpg";
import marketing from "@/assets/c-marketing.jpg";
import finance from "@/assets/c-finance.jpg";
import social from "@/assets/c-social.jpg";
import content from "@/assets/c-content.jpg";
import photography from "@/assets/c-photography.jpg";
import events from "@/assets/c-events.jpg";
import partnerships from "@/assets/c-partnerships.jpg";
import tech from "@/assets/c-tech.jpg";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSiteImages } from "@/lib/site-images.functions";

export const HERO_IMG = hero;
export const STUDIO_IMG = studio;

export const COMMITTEE_IMAGES: Record<string, string> = {
  sports, academic, marketing, finance, social, content,
  photography, events, partnerships, tech,
};

export function committeeImage(id: string): string | undefined {
  return COMMITTEE_IMAGES[id];
}

export const COMMITTEE_IDS = Object.keys(COMMITTEE_IMAGES);
export const heroKey = "hero";
export const studioKey = "studio";
export const committeeKey = (id: string) => `committee:${id}`;

export function useSiteImages() {
  const fn = useServerFn(listSiteImages);
  const { data } = useQuery({
    queryKey: ["site-images"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const map = new Map<string, string>((data ?? []).map((r) => [r.key, r.url]));
  return {
    hero: map.get(heroKey) || HERO_IMG,
    studio: map.get(studioKey) || STUDIO_IMG,
    committee: (id: string) => map.get(committeeKey(id)) || COMMITTEE_IMAGES[id],
    raw: map,
  };
}