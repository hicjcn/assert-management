"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
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
  value: number;
  amount: number;
  color: string;
  itemStyle: { color: string };
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
      value: centsToYuan(amount),
      amount,
      color: categoryColors[itemCategory],
      itemStyle: { color: categoryColors[itemCategory] },
    }));
  }, [mode, ranking]);
  const hasTrend = trendValues.some((value) => value !== 0);
  const hasDistribution = distribution.length > 0;
  const distributionTotal = distribution.reduce((sum, item) => sum + item.amount, 0);
  const maxRankingAmount = Math.max(
    ...ranking.map((item) => Math.abs(item.displayAmount)),
    1,
  );
  const lineOption: EChartsOption = {
    color: [modeDeepColors[mode]],
    grid: { top: 18, right: 10, bottom: 24, left: 44 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#dce6f0",
      borderWidth: 1,
      textStyle: { color: "#3a3a3c" },
      valueFormatter: (value) => formatCents(Number(value) * 100),
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: visibleMonths.map((month) => month.key.slice(5)),
      axisLine: { lineStyle: { color: "#dce6f0" } },
      axisTick: { show: false },
      axisLabel: { color: "#8a8f98", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#8a8f98",
        formatter: (value: number) => formatAxisYuan(value),
      },
      splitLine: { lineStyle: { color: "#edf3f7" } },
    },
    series: [
      {
        name: modeLabels[mode],
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: { color: modeDeepColors[mode], borderColor: "#ffffff", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${modeDeepColors[mode]}99` },
              { offset: 0.55, color: `${modeColors[mode]}42` },
              { offset: 1, color: `${modeColors[mode]}08` },
            ],
          },
        },
        lineStyle: { color: modeDeepColors[mode], width: 4 },
        data: trendValues.map(centsToYuan),
      },
    ],
  };
  const pieOption: EChartsOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#dce6f0",
      borderWidth: 1,
      textStyle: { color: "#3a3a3c" },
      formatter: "{b}: ¥{c} ({d}%)",
    },
    series: [
      {
        name: "分类占比",
        type: "pie",
        radius: ["52%", "84%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderWidth: 0,
        },
        data: distribution,
      },
    ],
  };

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
            <ReactECharts option={lineOption} style={{ height: 240 }} />
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
              <ReactECharts
                option={pieOption}
                style={{ height: 220, minWidth: 0 }}
              />
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
