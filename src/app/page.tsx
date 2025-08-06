"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TrendingUp, Plus } from "lucide-react";
import { LabelList, Line, LineChart, XAxis, CartesianGrid } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import NavBar from "@/components/nav-bar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const chartConfig = {
  total: {
    label: "Expense",
    color: "var(--chart-1)",
  },
};

const Page = () => {
  const [weeklyData, setWeeklyData] = useState<
    { day: string; total: number }[]
  >([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState<
    { title: string; amount: number; created_at: string }[]
  >([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const fetchWeeklyExpenses = async () => {
    const supabase = createClient();

    const today = new Date();
    const dayIndex = today.getDay();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("expense")
      .select("amount, created_at")
      .gte("created_at", startOfWeek.toISOString())
      .lte("created_at", endOfToday.toISOString());

    if (error) {
      toast.error("Failed to fetch weekly expenses");
      console.error(error);
      return;
    }

    const daysToShow = ALL_DAYS.slice(0, dayIndex + 1);
    const expenseMap = daysToShow.reduce(
      (acc, day) => ({ ...acc, [day]: 0 }),
      {} as Record<string, number>,
    );

    for (const expense of data) {
      const date = new Date(expense.created_at);
      const day = ALL_DAYS[date.getDay()];
      if (day in expenseMap) {
        expenseMap[day] += expense.amount;
      }
    }

    const chartData = daysToShow.map((day) => ({
      day,
      total: expenseMap[day],
    }));

    const total = chartData.reduce((sum, d) => sum + d.total, 0);

    setWeeklyData(chartData);
    setTotalExpense(total);
  };

  const fetchTodayExpenses = async () => {
    const supabase = createClient();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("expense")
      .select("title, amount, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    if (error) {
      toast.error("Failed to fetch today’s expenses");
      console.error(error);
      return;
    }

    setTodayExpenses(data ?? []);
  };

  const addExpense = async () => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      toast.error("User not found");
      return;
    }

    if (!title || !amount) {
      toast("Please fill all fields");
      return;
    }

    const { error: insertError } = await supabase.from("expense").insert({
      title,
      amount: parseFloat(amount),
      user_id: data.user.id,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      toast.error("Failed to add expense");
      return;
    }

    toast.success("Expense added");
    setTitle("");
    setAmount("");
    await fetchWeeklyExpenses();
    await fetchTodayExpenses();
  };
  useEffect(() => {
    fetchWeeklyExpenses();
    fetchTodayExpenses();
  }, []);
  return (
    <div className="max-w-md w-full mx-auto flex flex-col gap-4 px-2 py-4">
      <NavBar />

      {/* Add Expense Button + Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full flex gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lunch"
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 12.50"
              />
            </div>
            <Button onClick={addExpense}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Expense</CardTitle>
          <CardDescription>From Sunday to Today</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart
              data={weeklyData}
              margin={{ top: 20, left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                dataKey="total"
                type="natural"
                stroke="var(--color-total)"
                strokeWidth={2}
                dot={{ fill: "var(--color-total)" }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              </Line>
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 leading-none font-medium">
            Total so far: ${totalExpense.toFixed(2)}
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Tracked from Sunday to today
          </div>
        </CardFooter>
      </Card>

      {/* Today’s Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Today’s Expenses</CardTitle>
          <CardDescription>{todayExpenses.length} records</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {todayExpenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No expenses yet today.
            </p>
          ) : (
            todayExpenses.map((exp, i) => (
              <div
                key={i}
                className="flex justify-between text-sm border-b pb-1 last:border-none"
              >
                <span>{exp.title}</span>
                <span className="font-medium">${exp.amount.toFixed(2)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
