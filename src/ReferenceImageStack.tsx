type ReferenceImageTile = {
  height: number;
  src: string;
  width: number;
};

export function ReferenceImageStack({
  alt,
  tiles,
}: {
  alt: string;
  tiles: ReferenceImageTile[];
}) {
  return (
    <div className="reference-image-stack" role="img" aria-label={alt}>
      {tiles.map((tile, index) => (
        <img
          key={tile.src}
          className="reference-image-tile"
          src={tile.src}
          alt=""
          aria-hidden="true"
          width={tile.width}
          height={tile.height}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={index === 0 ? "high" : "auto"}
        />
      ))}
    </div>
  );
}
