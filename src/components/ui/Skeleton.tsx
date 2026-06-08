type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function MatchRowsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="match-rows">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="skeleton-match-row" key={index} />
      ))}
    </div>
  );
}

export function LeaderboardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="leaderboard">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="skeleton-leader-row" key={index} />
      ))}
    </div>
  );
}

export function PredictionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="prediction-list">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="skeleton-prediction-row" key={index} />
      ))}
    </div>
  );
}
