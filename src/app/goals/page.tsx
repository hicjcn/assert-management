import { GoalsWorkspace } from "@/components/goals/goals-workspace";
import { MobileShell } from "@/components/layout/mobile-shell";
import { requireSession } from "@/server/auth";
import { getGoalsPageData } from "@/server/goals";

function cents(value: bigint) {
  return value.toString();
}

export default async function GoalsPage() {
  const session = await requireSession();
  const { budget, goals } = await getGoalsPageData(session.userId);

  return (
    <MobileShell title="目标">
      <GoalsWorkspace
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
          note: goal.note,
          projection: {
            monthlyNetAmount: cents(goal.projection.monthlyNetAmount),
            remainingAmount: cents(goal.projection.remainingAmount),
            progressPercent: goal.projection.progressPercent,
            estimatedReachDate:
              goal.projection.estimatedReachDate?.toISOString() ?? null,
          },
        }))}
      />
    </MobileShell>
  );
}
