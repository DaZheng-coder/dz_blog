import { ClipTimelineTrackView } from "./ClipTimelineTrackView";

export function ClipTimeline() {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-white/10 bg-[#0b111b]/95">
      <ClipTimelineTrackView />
    </section>
  );
}
