"use client";

import { BarChart3, ChartPie, ChevronDown, ChevronUp, LineChart } from "lucide-react";
import { useMemo, useState } from "react";

import { AccountMark } from "@/components/accounts/account-visual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  accountCategoryLabels,
  type AccountCategory,
} from "@/types/domain";
import {
  chartModeValues,
  chartRangeValues,
  type ChartAccount,
  type ChartMode,
  type ChartRange,
  type ChartsData,
} from "@/types/charts";

const modeLabels: Record<ChartMode, string> = {
  asset: "资产",
  liability: "负债",
  net: "净资产",
};

const rangeLabels: Record<ChartRange, string> = {
  "3m": "3个月",
  "6m": "6个月",
  "12m": "12个月",
  all: "全部",
};

const modeColors: Record<ChartMode, string> = {
  asset: "#54b5ff",
  liability: "#ff7fa3",
  net: "#63d98f",
};

const modeDeepColors: Record<ChartMode, string> = {
  asset: "#168be8",
  liability: "#e64f7d",
  net: "#21a856",
};

const categoryColors: Record<AccountCategory, string> = {
  cash: "#e3aa00",
  debit_card: "#168de2",
  credit_card: "#e64f7d",
  virtual_account: "#16a991",
  investment: "#7d5bea",
  liability_account: "#e77d22",
  bond: "#159fad",
};

const modeSoftColors: Record<ChartMode, string> = {
  asset: "#dff1ff",
  liability: "#ffe3eb",
  net: "#def8e7",
};

const modeTextColors: Record<ChartMode, string> = {
  asset: "#096da8",
  liability: "#b73559",
  net: "#187a3b",
};

type DerivedChartItem = {
  id: string;
  name: string;
  category: AccountCategory;
  iconKey: string | null;
  amount: number;
  displayAmount: number;
  color: string;
};

type DistributionItem = {
  name: string;
  amount: number;
  color: string;
};

type ChartsDashboardProps = {
  data: ChartsData;
};

function centsToYuan(cents: number) {
  return Math.round(cents) / 100;
}

function formatCents(cents: number, options: { signed?: boolean } = {}) {
  const sign = cents < 0 ? "-" : options.signed && cents > 0 ? "+" : "";
  const absolute = Math.abs(cents);

  return `${sign}¥${Math.round(absolute / 100).toLocaleString("zh-CN")}`;
}

function formatAxisYuan(value: number) {
  if (Math.abs(value) >= 10_000) {
    return `${Math.round(value / 10_000)}万`;
  }

  return `${Math.round(value)}`;
}

function formatChartMonthLabel(monthKey: string) {
  const month = Number(monthKey.slice(5, 7));

  return `${month}月`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 1,
  }).format(value);
}

function accountBelongsToMode(account: ChartAccount, mode: ChartMode) {
  if (mode === "asset") {
    return account.type === "asset";
  }

  if (mode === "liability") {
    return account.type === "liability";
  }

  return true;
}

function signedAmountForMode(account: ChartAccount, amount: number, mode: ChartMode) {
  if (mode === "liability") {
    return amount;
  }

  if (mode === "net" && account.type === "liability") {
    return -amount;
  }

  return amount;
}

function rangeSize(range: ChartRange) {
  if (range === "3m") {
    return 3;
  }
  if (range === "6m") {
    return 6;
  }
  if (range === "12m") {
    return 12;
  }

  return Number.POSITIVE_INFINITY;
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-[#cad8e6] bg-[#fbfdff] px-6 text-center text-sm font-medium text-[#747d89]">
      {text}
    </div>
  );
}

function TrendChart({
  color,
  label,
  months,
  values,
}: {
  color: string;
  label: string;
  months: string[];
  values: number[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 320;
  const height = 220;
  const padding = { top: 18, right: 12, bottom: 28, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || Math.max(Math.abs(maxValue), 1);
  const yMin = minValue === maxValue ? minValue - range * 0.2 : minValue;
  const yMax = minValue === maxValue ? maxValue + range * 0.2 : maxValue;
  const yRange = yMax - yMin || 1;
  const points = values.map((value, index) => {
    const x =
      padding.left +
      (values.length <= 1 ? chartWidth / 2 : (index / (values.length - 1)) * chartWidth);
    const y = padding.top + ((yMax - value) / yRange) * chartHeight;

    return { x, y, value };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points.at(-1)?.x ?? padding.left} ${padding.top + chartHeight} L ${
          points[0].x
        } ${padding.top + chartHeight} Z`
      : "";
  const yTicks = [yMax, yMin + yRange / 2, yMin];
  const safeActiveIndex =
    activeIndex !== null && activeIndex >= 0 && activeIndex < points.length
      ? activeIndex
      : null;
  const activePoint = safeActiveIndex !== null ? points[safeActiveIndex] : null;
  const tooltipXPercent = activePoint ? (activePoint.x / width) * 100 : 50;
  const tooltipYPercent = activePoint ? (activePoint.y / height) * 100 : 0;
  const tooltipTransform =
    activePoint && activePoint.x < 86
      ? "translateY(calc(-100% - 10px))"
      : activePoint && activePoint.x > width - 86
        ? "translate(-100%, calc(-100% - 10px))"
        : "translate(-50%, calc(-100% - 10px))";

  return (
    <div className="relative">
      <svg
        aria-label={`${label}趋势图`}
        className="h-60 w-full overflow-visible touch-manipulation"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {yTicks.map((tick, index) => {
          const y = padding.top + ((yMax - tick) / yRange) * chartHeight;

          return (
            <g key={tick}>
              <line
                stroke="#edf3f7"
                strokeWidth="1"
                x1={padding.left}
                x2={padding.left + chartWidth}
                y1={y}
                y2={y}
              />
              <text
                fill="#8a8f98"
                fontSize="10"
                textAnchor="end"
                x={padding.left - 8}
                y={y + (index === 0 ? 4 : 3)}
              >
                {formatAxisYuan(centsToYuan(tick))}
              </text>
            </g>
          );
        })}

        {areaPath ? <path d={areaPath} fill={color} fillOpacity="0.12" /> : null}
        <path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeWidth="3" />

        {activePoint ? (
          <g aria-hidden="true">
            <line
              stroke={color}
              strokeDasharray="4 4"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top}
              y2={padding.top + chartHeight}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              fill={color}
              r="5"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        ) : null}

        {points.map((point, index) => (
          <circle
            cx={point.x}
            cy={point.y}
            fill="#ffffff"
            key={`${months[index]}-${point.value}`}
            r="3.5"
            stroke={color}
            strokeWidth="2"
          />
        ))}

        {points.map((point, index) => {
          const previousX = index === 0 ? padding.left : points[index - 1].x;
          const nextX =
            index === points.length - 1 ? padding.left + chartWidth : points[index + 1].x;
          const hitX = index === 0 ? padding.left : (previousX + point.x) / 2;
          const hitWidth =
            index === points.length - 1
              ? padding.left + chartWidth - hitX
              : (point.x + nextX) / 2 - hitX;

          return (
            <rect
              aria-label={`${months[index]} ${label}${formatCents(point.value)}`}
              className="cursor-pointer outline-none"
              fill="transparent"
              height={chartHeight}
              key={`${months[index]}-hit-area`}
              onClick={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onPointerEnter={() => setActiveIndex(index)}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") {
                  setActiveIndex(null);
                }
              }}
              role="button"
              tabIndex={0}
              width={hitWidth}
              x={hitX}
              y={padding.top}
            />
          );
        })}

        {months.map((month, index) => {
          if (months.length > 6 && index % 2 === 1 && index !== months.length - 1) {
            return null;
          }

          const x =
            padding.left +
            (months.length <= 1 ? chartWidth / 2 : (index / (months.length - 1)) * chartWidth);

          return (
            <text
              fill="#8a8f98"
              fontSize="10"
              key={month}
              textAnchor="middle"
              x={x}
              y={height - 8}
            >
              {month}
            </text>
          );
        })}
      </svg>

      {activePoint && safeActiveIndex !== null ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[104px] rounded-lg bg-[#202a34] px-3 py-2 text-center text-xs font-medium text-white shadow-[0_10px_24px_rgba(32,42,52,0.22)]"
          style={{
            left: `${tooltipXPercent}%`,
            top: `${tooltipYPercent}%`,
            transform: tooltipTransform,
          }}
        >
          <div className="text-[11px] text-white/72">{months[safeActiveIndex]}</div>
          <div className="mt-0.5 tabular-nums">{formatCents(activePoint.value)}</div>
        </div>
      ) : null}
    </div>
  );
}

function DistributionDonut({
  items,
  total,
}: {
  items: DistributionItem[];
  total: number;
}) {
  const size = 192;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const segments = items.reduce<
    Array<DistributionItem & { dashLength: number; dashOffset: number }>
  >((accumulator, item) => {
    const previous = accumulator.at(-1);
    const dashOffset = previous
      ? previous.dashOffset + previous.dashLength
      : 0;
    const dashLength = total > 0 ? (item.amount / total) * circumference : 0;

    return [...accumulator, { ...item, dashLength, dashOffset }];
  }, []);

  return (
    <svg
      aria-label="分类占比图"
      className="h-48 w-full"
      role="img"
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        cx={center}
        cy={center}
        fill="none"
        r={radius}
        stroke="#edf3f7"
        strokeWidth={strokeWidth}
      />
      {segments.map((item) => (
        <circle
          cx={center}
          cy={center}
          fill="none"
          key={item.name}
          r={radius}
          stroke={item.color}
          strokeDasharray={`${item.dashLength} ${circumference - item.dashLength}`}
          strokeDashoffset={-item.dashOffset}
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${center} ${center})`}
        />
      ))}
      <text
        fill="#30343a"
        fontSize="18"
        fontWeight="700"
        textAnchor="middle"
        x={center}
        y={center - 2}
      >
        {formatCents(total)}
      </text>
      <text
        fill="#8a8f98"
        fontSize="11"
        fontWeight="500"
        textAnchor="middle"
        x={center}
        y={center + 18}
      >
        合计
      </text>
    </svg>
  );
}

export function ChartsDashboard({ data }: ChartsDashboardProps) {
  const [mode, setMode] = useState<ChartMode>("asset");
  const [range, setRange] = useState<ChartRange>("12m");
  const [category, setCategory] = useState<AccountCategory | "all">("all");
  const [accountId, setAccountId] = useState<string>("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const selectableAccounts = useMemo(
    () =>
      data.accounts.filter(
        (account) =>
          accountBelongsToMode(account, mode) &&
          (category === "all" || account.category === category),
      ),
    [category, data.accounts, mode],
  );
  const selectedAccounts = useMemo(
    () =>
      selectableAccounts.filter(
        (account) => accountId === "all" || account.id === accountId,
      ),
    [accountId, selectableAccounts],
  );
  const categories = useMemo(() => {
    const values = new Set<AccountCategory>();

    for (const account of data.accounts) {
      if (accountBelongsToMode(account, mode)) {
        values.add(account.category);
      }
    }

    return Array.from(values);
  }, [data.accounts, mode]);
  const visibleMonths = useMemo(() => {
    const size = rangeSize(range);

    if (!Number.isFinite(size)) {
      return data.months;
    }

    return data.months.slice(-size);
  }, [data.months, range]);
  const latestSnapshot = visibleMonths.at(-1);
  const trendValues = useMemo(
    () =>
      visibleMonths.map((month) =>
        selectedAccounts.reduce((sum, account) => {
          const amount = month.accountAmounts[account.id] ?? 0;

          return sum + signedAmountForMode(account, amount, mode);
        }, 0),
      ),
    [mode, selectedAccounts, visibleMonths],
  );
  const ranking = useMemo<DerivedChartItem[]>(() => {
    if (!latestSnapshot) {
      return [];
    }

    return selectedAccounts
      .map((account) => {
        const amount = signedAmountForMode(
          account,
          latestSnapshot.accountAmounts[account.id] ?? 0,
          mode,
        );

        return {
          id: account.id,
          name: account.name,
          category: account.category,
          iconKey: account.iconKey,
          amount,
          displayAmount: mode === "net" ? amount : Math.abs(amount),
          color: categoryColors[account.category],
        };
      })
      .filter((item) => item.displayAmount !== 0)
      .sort((left, right) => Math.abs(right.displayAmount) - Math.abs(left.displayAmount));
  }, [latestSnapshot, mode, selectedAccounts]);
  const distribution = useMemo<DistributionItem[]>(() => {
    const grouped = new Map<AccountCategory, number>();

    for (const item of ranking) {
      const value = mode === "net" ? Math.abs(item.amount) : item.displayAmount;
      grouped.set(item.category, (grouped.get(item.category) ?? 0) + value);
    }

    return Array.from(grouped.entries()).map(([itemCategory, amount]) => ({
      name: accountCategoryLabels[itemCategory],
      amount,
      color: categoryColors[itemCategory],
    }));
  }, [mode, ranking]);
  const hasTrend = trendValues.some((value) => value !== 0);
  const hasDistribution = distribution.length > 0;
  const distributionTotal = distribution.reduce((sum, item) => sum + item.amount, 0);
  const maxRankingAmount = Math.max(
    ...ranking.map((item) => Math.abs(item.displayAmount)),
    1,
  );
  return (
    <div className="space-y-4">
      <Card className="border-[#dce7f1] bg-[#fbfdff]/95 shadow-[0_14px_32px_rgba(84,181,255,0.12)]">
        <CardContent className="space-y-3 pt-4">
          <div className="grid grid-cols-3 gap-2">
            {chartModeValues.map((value) => (
              <button
                className={cn(
                  "h-10 rounded-lg text-sm font-semibold transition",
                  mode === value
                    ? "shadow-[0_8px_18px_rgba(84,181,255,0.18)] ring-1 ring-white/90"
                    : "bg-white/85 text-[#596573] ring-1 ring-[#e1e9f1]",
                )}
                key={value}
                onClick={() => {
                  setMode(value);
                  setCategory("all");
                  setAccountId("all");
                }}
                style={
                  mode === value
                    ? {
                        backgroundColor: modeSoftColors[value],
                        color: modeTextColors[value],
                      }
                    : undefined
                }
                type="button"
              >
                {modeLabels[value]}
              </button>
            ))}
          </div>

          <button
            aria-expanded={filtersExpanded}
            className="mx-auto flex h-5 items-center justify-center gap-0.5 text-[#8a96a3] transition hover:text-[#3f8fc4]"
            onClick={() => setFiltersExpanded((expanded) => !expanded)}
            type="button"
          >
            <span className="text-[10px] font-medium leading-none">
              {filtersExpanded ? "收起筛选" : "展开筛选"}
            </span>
            {filtersExpanded ? (
              <ChevronUp aria-hidden="true" className="h-3 w-3" />
            ) : (
              <ChevronDown aria-hidden="true" className="h-3 w-3" />
            )}
          </button>

          {filtersExpanded ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {chartRangeValues.map((value) => (
                  <button
                    className={cn(
                      "h-9 rounded-lg text-xs font-medium transition",
                      range === value
                        ? "bg-[#dff1ff] text-[#096da8] ring-1 ring-[#9ed8ff]"
                        : "bg-white/85 text-[#6f7a86] ring-1 ring-[#e1e9f1]",
                    )}
                    key={value}
                    onClick={() => setRange(value)}
                    type="button"
                  >
                    {rangeLabels[value]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  className="h-10 rounded-lg border border-[#dce7f1] bg-white/90 px-3 text-sm text-[#30343a] shadow-sm shadow-[#cbddea]/40 outline-none transition focus:border-[#54b5ff] focus:ring-2 focus:ring-[#54b5ff]/25"
                  onChange={(event) => {
                    setCategory(event.target.value as AccountCategory | "all");
                    setAccountId("all");
                  }}
                  value={category}
                >
                  <option value="all">全部分类</option>
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {accountCategoryLabels[value]}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-[#dce7f1] bg-white/90 px-3 text-sm text-[#30343a] shadow-sm shadow-[#cbddea]/40 outline-none transition focus:border-[#54b5ff] focus:ring-2 focus:ring-[#54b5ff]/25"
                  onChange={(event) => setAccountId(event.target.value)}
                  value={accountId}
                >
                  <option value="all">全部账户</option>
                  {selectableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-[#dce7f1] bg-white/92 shadow-[0_14px_30px_rgba(84,181,255,0.10)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-semibold text-[#586575]">
            {modeLabels[mode]}趋势
          </CardTitle>
          <LineChart className="h-4 w-4" style={{ color: modeColors[mode] }} />
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <TrendChart
              color={modeDeepColors[mode]}
              label={modeLabels[mode]}
              months={visibleMonths.map((month) => formatChartMonthLabel(month.key))}
              values={trendValues}
            />
          ) : (
            <EmptyChart text="当前筛选条件下暂无趋势数据。" />
          )}
        </CardContent>
      </Card>

      <Card className="border-[#dce7f1] bg-white/92 shadow-[0_14px_30px_rgba(255,127,163,0.10)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-semibold text-[#586575]">
            {modeLabels[mode]}分类占比
          </CardTitle>
          <ChartPie className="h-4 w-4" style={{ color: modeColors[mode] }} />
        </CardHeader>
        <CardContent>
          {hasDistribution ? (
            <div className="grid grid-cols-[minmax(148px,1.12fr)_minmax(0,0.88fr)] items-center gap-4">
              <DistributionDonut items={distribution} total={distributionTotal} />
              <div className="space-y-2 pl-2">
                {distribution.map((item) => {
                  const percent =
                    distributionTotal > 0 ? (item.amount / distributionTotal) * 100 : 0;

                  return (
                    <div
                      className="flex min-w-0 items-center gap-2 text-sm"
                      key={item.name}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[#30343a]">
                        {item.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-[#6f7a86]">
                        {formatPercent(percent)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyChart text="当前筛选条件下暂无可展示的分类占比。" />
          )}
        </CardContent>
      </Card>

      <Card className="border-[#dce7f1] bg-white/92 shadow-[0_14px_30px_rgba(99,217,143,0.10)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-semibold text-[#586575]">
            {modeLabels[mode]}排行榜
          </CardTitle>
          <BarChart3 className="h-4 w-4" style={{ color: modeColors[mode] }} />
        </CardHeader>
        <CardContent className="space-y-3">
          {ranking.length === 0 ? (
            <EmptyChart text="当前筛选条件下暂无账户排行。" />
          ) : (
            ranking.map((item, index) => (
              <div className="space-y-1.5" key={item.id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#eaf5ff] text-xs font-semibold text-[#096da8]">
                      {index + 1}
                    </span>
                    <AccountMark
                      category={item.category}
                      className="h-8 w-8 rounded-lg"
                      iconClassName="max-h-5 max-w-6"
                      iconKey={item.iconKey}
                      name={item.name}
                      variant="soft"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#30343a]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#8a8f98]">
                        {accountCategoryLabels[item.category]}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      item.displayAmount < 0 ? "text-[#a64f65]" : "text-[#30343a]",
                    )}
                  >
                    {formatCents(item.displayAmount, { signed: mode === "net" })}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#eaf0f5]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(
                        8,
                        (Math.abs(item.displayAmount) / maxRankingAmount) * 100,
                      )}%`,
                      backgroundColor:
                        mode === "net" && item.displayAmount < 0
                          ? "#ff7fa3"
                          : item.color,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
