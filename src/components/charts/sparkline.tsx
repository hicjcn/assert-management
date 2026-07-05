import { useId } from "react";

type SparklineProps = {
  values: number[];
  color: string;
  ariaLabel: string;
  className?: string;
  width?: number;
  height?: number;
};

export function Sparkline({
  values,
  color,
  ariaLabel,
  className,
  width = 120,
  height = 44,
}: SparklineProps) {
  const gradientId = useId();
  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const hasValues = values.length > 0;
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const span = maxValue - minValue || Math.max(Math.abs(maxValue), Math.abs(minValue), 1);
  const yMin = minValue === maxValue ? minValue - span * 0.2 : minValue;
  const yMax = minValue === maxValue ? maxValue + span * 0.2 : maxValue;
  const yRange = yMax - yMin || 1;
  const points = values.map((value, index) => {
    const x =
      padding +
      (values.length <= 1
        ? innerWidth / 2
        : (index / (values.length - 1)) * innerWidth);
    const y = padding + ((yMax - value) / yRange) * innerHeight;

    return { x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points.at(-1)!.x} ${padding + innerHeight} L ${points[0]!.x} ${padding + innerHeight} Z`
      : "";

  if (!hasValues) {
    return (
      <svg
        aria-label={ariaLabel}
        className={className}
        height={height}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
      />
    );
  }

  return (
    <svg
      aria-label={ariaLabel}
      className={className}
      height={height}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      {points.map((point, index) => (
        <circle
          cx={point.x}
          cy={point.y}
          fill="#ffffff"
          key={`${point.x}-${point.y}-${index}`}
          r={points.length === 1 ? 2.5 : 2}
          stroke={color}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
