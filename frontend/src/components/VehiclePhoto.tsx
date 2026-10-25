import type { Vehicle, VehicleImage } from '../types';
import { SketchCar } from './SketchCar';

/** Line under a photo crediting its author and license, as CC licenses require. */
export function PhotoCredit({ image, className = '' }: { image: VehicleImage; className?: string }) {
  return (
    <p className={`text-[12px] text-slate-500 ${className}`}>
      Photo:{' '}
      <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink-900">
        {image.author}
      </a>
      {' · '}
      {image.licenseUrl ? (
        <a href={image.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink-900">
          {image.license}
        </a>
      ) : (
        image.license
      )}
      {' · Wikimedia Commons'}
    </p>
  );
}

/**
 * The vehicle's first photo filling its box, or the sketch illustration when
 * it has none. `size` picks the thumbnail (cards) or full image (detail page).
 */
export function VehicleCover({
  vehicle,
  size = 'thumb',
  className = '',
}: {
  vehicle: Vehicle;
  size?: 'thumb' | 'full';
  className?: string;
}) {
  const image = vehicle.images?.[0];
  const soldOut = vehicle.quantity === 0;
  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <SketchCar withScene={false} className={`h-2/3 w-auto ${soldOut ? 'opacity-50 grayscale' : ''}`} />
      </div>
    );
  }
  return (
    <img
      src={size === 'thumb' ? image.thumbUrl : image.url}
      alt={image.title}
      loading="lazy"
      className={`object-cover ${soldOut ? 'grayscale' : ''} ${className}`}
    />
  );
}
