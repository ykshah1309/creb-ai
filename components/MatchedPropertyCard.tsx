import PropertyCard from "./PropertyCard";

export default function MatchedPropertyCard({
  property,
  matchId,
  onClick,
}: {
  property: any;
  matchId: string;
  onClick?: () => void;
}) {
  return (
    <PropertyCard
      property={property}
      highlight
      badgeText="Matched"
      onClick={onClick}
    />
  );
}