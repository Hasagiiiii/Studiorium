import type { PostMedia } from '@lorion/contracts';

export function PostMediaGallery({ media }: { media: PostMedia[] }) {
  if (!media.length) return null;

  return (
    <div className={`post-media-gallery ${media.length > 1 ? 'is-carousel' : 'is-single'}`}>
      {media.map((item, index) => (
        <figure className="post-media-item" key={item.id}>
          {item.type === 'video' ? (
            <video
              src={item.url}
              poster={item.previewUrl || undefined}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={item.url}
              alt={item.caption || `Foto ${index + 1} da publicação`}
              loading="lazy"
            />
          )}
          {item.caption ? <figcaption>{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}
