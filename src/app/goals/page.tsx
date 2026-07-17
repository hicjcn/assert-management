import { GoalsWorkspace } from "@/components/goals/goals-workspace";
import { requireSession } from "@/server/auth";
import { getGoalsPageData } from "@/server/goals";

function cents(value: bigint) {
  return value.toString();
}

export default async function GoalsPage() {
  const session = await requireSession();
  const { accounts, budget, goals } = await getGoalsPageData(session.userId);

  return (
    <GoalsWorkspace
      accounts={accounts.map((account) => ({
        id: account.id,
        name: account.name,
        category: account.category,
        currentAmount: cents(account.currentAmount),
      }))}
      budget={{
        monthlyIncome: cents(budget.monthlyIncome),
        monthlyRent: cents(budget.monthlyRent),
        monthlyFood: cents(budget.monthlyFood),
        monthlyLiving: cents(budget.monthlyLiving),
        monthlyOtherExpense: cents(budget.monthlyOtherExpense),
        monthlyOtherIncome: cents(budget.monthlyOtherIncome),
      }}
      goals={goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: cents(goal.targetAmount),
        currentAmount: cents(goal.currentAmount),
        oneTimeIncome: cents(goal.oneTimeIncome),
        oneTimeExpense: cents(goal.oneTimeExpense),
        accountIds: goal.accountIds,
        linkedAccounts: goal.linkedAccounts,
        progressSource: goal.progressSource,
        note: goal.note,
        projection: {
          monthlyNetAmount: cents(goal.projection.monthlyNetAmount),
          remainingAmount: cents(goal.projection.remainingAmount),
          progressPercent: goal.projection.progressPercent,
          estimatedReachDate:
            goal.projection.estimatedReachDate?.toISOString() ?? null,
        },
        trendProjection: {
          monthlyTrendAmount: cents(
            goal.trendProjection.monthlyTrendAmount,
          ),
          monthlyBreakdown: goal.trendProjection.monthlyBreakdown.map(
            (month) => ({
              month: month.month,
              amount: cents(month.amount),
              changeCount: month.changeCount,
            }),
          ),
          observedMonths: goal.trendProjection.observedMonths,
          changeCount: goal.trendProjection.changeCount,
          estimatedReachDate:
            goal.trendProjection.estimatedReachDate?.toISOString() ?? null,
        },
      }))}
    />
  );
}
