import { lazy, Suspense } from 'react';
import { Skeleton } from './ui';

// Leaflet is only downloaded the first time a map is shown.
const load = () => import('./Maps');
const LocationPickerImpl = lazy(() => load().then((m) => ({ default: m.LocationPicker })));
const PlaceMapImpl = lazy(() => load().then((m) => ({ default: m.PlaceMap })));
const ListingsMapImpl = lazy(() => load().then((m) => ({ default: m.ListingsMap })));

function Fallback({ height }) {
  return <Skeleton className={`w-full rounded-2xl ${height}`} />;
}

export function LocationPicker(props) {
  return (
    <Suspense fallback={<Fallback height={props.height || 'h-56'} />}>
      <LocationPickerImpl {...props} />
    </Suspense>
  );
}

export function PlaceMap(props) {
  return (
    <Suspense fallback={<Fallback height={props.height || 'h-44'} />}>
      <PlaceMapImpl {...props} />
    </Suspense>
  );
}

export function ListingsMap(props) {
  return (
    <Suspense fallback={<Fallback height={props.height || 'h-[60dvh]'} />}>
      <ListingsMapImpl {...props} />
    </Suspense>
  );
}
