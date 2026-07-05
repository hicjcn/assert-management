import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Landmark,
  PiggyBank,
  ReceiptText,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  type AccountCategory,
  type AccountIconKey,
  type AccountType,
  accountIconValues,
} from "@/types/domain";

type AccountVisual = {
  icon: LucideIcon;
  accent: string;
  surface: string;
  softSurface: string;
  text: string;
  border: string;
  amount: string;
};

const accountVisuals: Record<AccountCategory, AccountVisual> = {
  cash: {
    icon: Banknote,
    accent: "bg-emerald-500",
    surface: "bg-emerald-500 text-white",
    softSurface: "bg-emerald-50 text-emerald-700",
    text: "text-emerald-700",
    border: "border-emerald-100",
    amount: "text-emerald-700",
  },
  debit_card: {
    icon: CreditCard,
    accent: "bg-sky-500",
    surface: "bg-sky-500 text-white",
    softSurface: "bg-sky-50 text-sky-700",
    text: "text-sky-700",
    border: "border-sky-100",
    amount: "text-sky-700",
  },
  credit_card: {
    icon: ReceiptText,
    accent: "bg-rose-500",
    surface: "bg-rose-500 text-white",
    softSurface: "bg-rose-50 text-rose-700",
    text: "text-rose-700",
    border: "border-rose-100",
    amount: "text-rose-700",
  },
  virtual_account: {
    icon: Smartphone,
    accent: "bg-violet-500",
    surface: "bg-violet-500 text-white",
    softSurface: "bg-violet-50 text-violet-700",
    text: "text-violet-700",
    border: "border-violet-100",
    amount: "text-violet-700",
  },
  investment: {
    icon: PiggyBank,
    accent: "bg-amber-500",
    surface: "bg-amber-500 text-white",
    softSurface: "bg-amber-50 text-amber-700",
    text: "text-amber-700",
    border: "border-amber-100",
    amount: "text-amber-700",
  },
  liability_account: {
    icon: Landmark,
    accent: "bg-orange-500",
    surface: "bg-orange-500 text-white",
    softSurface: "bg-orange-50 text-orange-700",
    text: "text-orange-700",
    border: "border-orange-100",
    amount: "text-orange-700",
  },
  bond: {
    icon: CircleDollarSign,
    accent: "bg-teal-500",
    surface: "bg-teal-500 text-white",
    softSurface: "bg-teal-50 text-teal-700",
    text: "text-teal-700",
    border: "border-teal-100",
    amount: "text-teal-700",
  },
};

const accountTypeTone: Record<AccountType, string> = {
  asset: "bg-[#1d1d1f] text-white",
  liability: "bg-rose-600 text-white",
};

const accountBrandIcons: Record<
  AccountIconKey,
  { src: string; alt: string; keywords: string[] }
> = {
  china_construction_bank: {
    src: "/brand-icons/china-construction-bank.svg",
    alt: "建设银行",
    keywords: ["建设银行", "建行", "ccb", "china construction bank"],
  },
  bank_of_china: {
    src: "/brand-icons/bank-of-china.svg",
    alt: "中国银行",
    keywords: ["中国银行", "中行", "boc", "bank of china"],
  },
  china_merchants_bank: {
    src: "/brand-icons/china-merchants-bank.svg",
    alt: "招商银行",
    keywords: ["招商银行", "招行", "cmb", "china merchants bank"],
  },
  alipay: {
    src: "/brand-icons/alipay.svg",
    alt: "支付宝",
    keywords: ["支付宝", "alipay"],
  },
  wechat: {
    src: "/brand-icons/wechat.svg",
    alt: "微信",
    keywords: ["微信", "wechat", "weixin"],
  },
  apple: {
    src: "/brand-icons/apple.svg",
    alt: "苹果",
    keywords: ["苹果", "apple", "icloud", "apple card"],
  },
};

export function getAccountVisual(category: AccountCategory) {
  return accountVisuals[category];
}

export function normalizeAccountIconKey(
  iconKey?: string | null,
): AccountIconKey | null {
  if (!iconKey) {
    return null;
  }

  return accountIconValues.includes(iconKey as AccountIconKey)
    ? (iconKey as AccountIconKey)
    : null;
}

export function inferAccountIconKey(name: string): AccountIconKey | null {
  const normalizedName = name.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  return (
    accountIconValues.find((iconKey) =>
      accountBrandIcons[iconKey].keywords.some((keyword) =>
        normalizedName.includes(keyword.toLowerCase()),
      ),
    ) ?? null
  );
}

export function getAccountBrandIcon(iconKey?: string | null) {
  const normalizedIconKey = normalizeAccountIconKey(iconKey);

  return normalizedIconKey ? accountBrandIcons[normalizedIconKey] : null;
}

type AccountMarkProps = {
  category: AccountCategory;
  className?: string;
  iconKey?: string | null;
  iconClassName?: string;
  name?: string;
  variant?: "solid" | "soft";
};

export function AccountMark({
  category,
  className,
  iconKey,
  iconClassName,
  name,
  variant = "solid",
}: AccountMarkProps) {
  const visual = getAccountVisual(category);
  const brandIcon =
    getAccountBrandIcon(iconKey) ??
    (name ? getAccountBrandIcon(inferAccountIconKey(name)) : null);
  const Icon = visual.icon;

  if (brandIcon) {
    return (
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/90 ring-1 ring-black/[0.08]",
          className,
        )}
      >
        <Image
          alt={brandIcon.alt}
          className={cn("max-h-7 max-w-8 object-contain", iconClassName)}
          height={28}
          src={brandIcon.src}
          width={32}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
        variant === "solid" ? visual.surface : visual.softSurface,
        className,
      )}
    >
      <Icon className={cn("h-5 w-5", iconClassName)} />
    </span>
  );
}

type AccountTypeBadgeProps = {
  type: AccountType;
  children: ReactNode;
  className?: string;
};

export function AccountTypeBadge({
  type,
  children,
  className,
}: AccountTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full px-1.5 text-[10px] font-medium",
        accountTypeTone[type],
        className,
      )}
    >
      {children}
    </span>
  );
}
