import { Block } from "@/components/ui/block";
import { toEmbedUrl } from "@/lib/video";

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = toEmbedUrl(url);

  if (!embed) {
    return (
      <Block color="white" className="p-6">
        <p className="mono mb-3 text-eyebrow text-ink-muted">External video</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[16px] underline underline-offset-4"
        >
          Open the demo video ↗
        </a>
      </Block>
    );
  }

  return (
    <div className="border border-ink bg-block-ink">
      <div className="relative w-full pt-[56.25%]">
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 size-full"
        />
      </div>
    </div>
  );
}
