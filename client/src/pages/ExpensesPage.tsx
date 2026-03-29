import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { Plus, DollarSign, Calendar, Trash2, Check, X, Download, BarChart3, PieChart as PieChartIcon, User } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Layout from "@/components/Layout";
import type { Expense, Child } from "@shared/schema";

interface ExpenseFormData {
  child_id: number;
  title: string;
  amount: number;
  category: string;
  paid_by: string;
  split_percentage: number;
  date: string;
  receipt: string;
  status: string;
  notes: string;
}

function createEmptyFormData(): ExpenseFormData {
  return {
    child_id: 0,
    title: "",
    amount: 0,
    category: "other",
    paid_by: "parentA",
    split_percentage: 50,
    date: new Date().toISOString().split("T")[0],
    receipt: "",
    status: "pending",
    notes: "",
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  medical: "bg-red-100 text-red-800",
  education: "bg-purple-100 text-purple-800",
  activities: "bg-orange-100 text-orange-800",
  clothing: "bg-pink-100 text-pink-800",
  food: "bg-green-100 text-green-800",
  transport: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#14b8a6",
  "#6b7280",
];

const CATEGORY_CHART_COLORS: Record<string, string> = {
  medical: "#ef4444",
  education: "#a855f7",
  activities: "#f97316",
  clothing: "#ec4899",
  food: "#22c55e",
  transport: "#06b6d4",
  other: "#6b7280",
};

function buildChildLookup(children: Child[]): Map<number, string> {
  const lookup = new Map<number, string>();
  for (const child of children) {
    lookup.set(child.id, child.name);
  }
  return lookup;
}

function buildMonthOptions(): { value: string; label: string }[] {
  const options = [{ value: "all", label: "All Months" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    options.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    });
  }
  return options;
}

function filterByMonth(expenses: Expense[], monthKey: string): Expense[] {
  if (monthKey === "all") return expenses;
  const [year, month] = monthKey.split("-").map(Number);
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return expenses.filter((e) => {
    const expenseDate = typeof e.date === "string" ? parseISO(e.date) : new Date(e.date);
    return isWithinInterval(expenseDate, { start, end });
  });
}

function buildMonthlyData(expenses: Expense[]): { month: string; total: number; yourShare: number; theirShare: number }[] {
  const buckets = new Map<string, { total: number; yourShare: number; theirShare: number }>();

  for (const e of expenses) {
    const d = typeof e.date === "string" ? parseISO(e.date) : new Date(e.date);
    const key = format(d, "yyyy-MM");
    const existing = buckets.get(key) || { total: 0, yourShare: 0, theirShare: 0 };
    const amount = e.amount / 100;
    const splitPct = e.split_percentage ?? 50;
    existing.total += amount;
    existing.yourShare += amount * (splitPct / 100);
    existing.theirShare += amount * ((100 - splitPct) / 100);
    buckets.set(key, existing);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, data]) => ({
      month: format(parseISO(`${key}-01`), "MMM yyyy"),
      total: parseFloat(data.total.toFixed(2)),
      yourShare: parseFloat(data.yourShare.toFixed(2)),
      theirShare: parseFloat(data.theirShare.toFixed(2)),
    }));
}

function buildCategoryData(expenses: Expense[]): { name: string; value: number; color: string }[] {
  const buckets = new Map<string, number>();
  for (const e of expenses) {
    const cat = e.category || "other";
    buckets.set(cat, (buckets.get(cat) || 0) + e.amount / 100);
  }
  return Array.from(buckets.entries())
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: parseFloat(value.toFixed(2)),
      color: CATEGORY_CHART_COLORS[name] || CATEGORY_CHART_COLORS.other,
    }))
    .sort((a, b) => b.value - a.value);
}

function exportToCsv(expenses: Expense[], childLookup: Map<number, string>): void {
  const headers = ["Date", "Title", "Category", "Amount", "Paid By", "Split %", "Your Share", "Their Share", "Status", "Child", "Notes"];
  const rows = expenses.map((e) => {
    const amount = e.amount / 100;
    const splitPct = e.split_percentage ?? 50;
    const yourShare = amount * (splitPct / 100);
    const theirShare = amount * ((100 - splitPct) / 100);
    const dateStr = typeof e.date === "string" ? e.date : format(new Date(e.date), "yyyy-MM-dd");
    return [
      dateStr,
      `"${(e.title || "").replace(/"/g, '""')}"`,
      e.category,
      amount.toFixed(2),
      e.paid_by === "parentA" ? "Parent A" : "Parent B",
      splitPct.toString(),
      yourShare.toFixed(2),
      theirShare.toFixed(2),
      e.status,
      childLookup.get(e.child_id) || "Unknown",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExpensesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("expenses");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", selectedFilter !== "all" ? selectedFilter : undefined],
    queryFn: () =>
      api.getExpenses(
        undefined,
        selectedFilter !== "all" ? selectedFilter : undefined,
      ),
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: () => api.getChildren(),
  });

  const childLookup = useMemo(() => buildChildLookup(children), [children]);
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const filteredExpenses = useMemo(() => filterByMonth(expenses, selectedMonth), [expenses, selectedMonth]);
  const monthlyChartData = useMemo(() => buildMonthlyData(expenses), [expenses]);
  const categoryChartData = useMemo(() => buildCategoryData(filteredExpenses), [filteredExpenses]);

  const [formData, setFormData] = useState<ExpenseFormData>(createEmptyFormData());

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense added",
        description: "The expense has been logged successfully.",
      });
      setIsDialogOpen(false);
      setFormData(createEmptyFormData());
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense updated",
        description: "The expense status has been updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({
        title: "Expense deleted",
        description: "The expense has been removed.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.child_id || formData.child_id === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a child for this expense.",
      });
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid amount.",
      });
      return;
    }

    const expenseData: Record<string, unknown> = {
      child_id: formData.child_id,
      title: formData.title,
      amount: Math.round(parseFloat(formData.amount.toString()) * 100),
      category: formData.category,
      paid_by: formData.paid_by,
      split_percentage: formData.split_percentage,
      date: formData.date,
      receipt: formData.receipt || null,
      status: formData.status,
      notes: formData.notes || null,
    };
    createMutation.mutate(expenseData);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "reimbursed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  };

  const totalPending =
    filteredExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0) / 100;

  const totalApproved =
    filteredExpenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.amount, 0) / 100;

  const totalAll = filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / 100;

  const totalYourShare = filteredExpenses.reduce((sum, e) => {
    const splitPct = e.split_percentage ?? 50;
    return sum + (e.amount / 100) * (splitPct / 100);
  }, 0);

  const totalTheirShare = totalAll - totalYourShare;

  return (
    <Layout>
      <div className="p-6 space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Expense Tracking</h1>
            <p className="text-muted-foreground">
              Manage and split childcare expenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportToCsv(filteredExpenses, childLookup)}
              disabled={filteredExpenses.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Log New Expense</DialogTitle>
                    <DialogDescription>
                      Add a new expense to split with the other parent.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Doctor's visit"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="child_id">Child</Label>
                      <Select
                        value={formData.child_id.toString()}
                        onValueChange={(value) => setFormData({ ...formData, child_id: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select child" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id.toString()}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medical">Medical</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="activities">Activities</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paid_by">Paid By</Label>
                        <Select
                          value={formData.paid_by}
                          onValueChange={(value) => setFormData({ ...formData, paid_by: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parentA">Parent A</SelectItem>
                            <SelectItem value="parentB">Parent B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="split_percentage">Split Percentage</Label>
                      <Input
                        id="split_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.split_percentage}
                        onChange={(e) => setFormData({ ...formData, split_percentage: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your share: {formData.split_percentage || 50}% | Other parent: {100 - (formData.split_percentage || 50)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any additional details..."
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Expense"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Monthly filter dropdown */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium text-muted-foreground">Filter by month:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-sm soft-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredExpenses.filter((e) => e.status === "pending").length} expenses
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm soft-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalApproved.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredExpenses.filter((e) => e.status === "approved").length} expenses
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm soft-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAll.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{filteredExpenses.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Expenses | Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Expenses tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                onClick={() => setSelectedFilter("all")}
              >
                All
              </Button>
              <Button
                variant={selectedFilter === "pending" ? "default" : "outline"}
                onClick={() => setSelectedFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={selectedFilter === "approved" ? "default" : "outline"}
                onClick={() => setSelectedFilter("approved")}
              >
                Approved
              </Button>
              <Button
                variant={selectedFilter === "reimbursed" ? "default" : "outline"}
                onClick={() => setSelectedFilter("reimbursed")}
              >
                Reimbursed
              </Button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading expenses...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No expenses found. Click "Log Expense" to add one.
                </div>
              ) : (
                filteredExpenses.map((expense) => {
                  const amount = expense.amount / 100;
                  const splitPct = expense.split_percentage ?? 50;
                  const yourShare = amount * (splitPct / 100);
                  const theirShare = amount * ((100 - splitPct) / 100);
                  const childName = childLookup.get(expense.child_id);

                  return (
                    <Card key={expense.id} className="border-none shadow-sm soft-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{expense.title}</h3>
                              <Badge className={getCategoryColor(expense.category)}>
                                {expense.category}
                              </Badge>
                              <Badge className={getStatusColor(expense.status)}>
                                {expense.status}
                              </Badge>
                              {childName && (
                                <Badge variant="outline" className="gap-1">
                                  <User className="h-3 w-3" />
                                  {childName}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>
                                Amount: <span className="font-semibold text-lg text-foreground">${amount.toFixed(2)}</span>
                              </p>
                              <div className="flex gap-4">
                                <p>
                                  Your share: <span className="font-medium text-teal-600">${yourShare.toFixed(2)}</span>
                                </p>
                                <p>
                                  Their share: <span className="font-medium text-slate-600">${theirShare.toFixed(2)}</span>
                                </p>
                              </div>
                              <p>Paid by: {expense.paid_by === "parentA" ? "Parent A" : "Parent B"}</p>
                              <p>Split: {splitPct}% / {100 - splitPct}%</p>
                              <p>Date: {format(new Date(expense.date), "MMM d, yyyy")}</p>
                              {expense.receipt && (
                                <p className="text-xs">
                                  Receipt: <a href={expense.receipt} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline hover:text-teal-700">View receipt</a>
                                </p>
                              )}
                              {expense.notes && (
                                <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs">
                                  <span className="font-medium">Notes:</span> {expense.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {expense.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMutation.mutate({
                                    id: expense.id,
                                    data: { status: "approved" },
                                  })}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMutation.mutate({
                                    id: expense.id,
                                    data: { status: "reimbursed" },
                                  })}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {expense.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateMutation.mutate({
                                  id: expense.id,
                                  data: { status: "reimbursed" },
                                })}
                              >
                                Mark Reimbursed
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Share comparison cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-none shadow-sm soft-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Your Share</CardTitle>
                  <CardDescription>Based on split percentages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-teal-600">
                    ${totalYourShare.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAll > 0 ? ((totalYourShare / totalAll) * 100).toFixed(1) : "0"}% of total
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm soft-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Other Parent's Share</CardTitle>
                  <CardDescription>Based on split percentages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-slate-600">
                    ${totalTheirShare.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAll > 0 ? ((totalTheirShare / totalAll) * 100).toFixed(1) : "0"}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly spending bar chart */}
            <Card className="border-none shadow-sm soft-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  <CardTitle className="font-display font-bold">Monthly Spending Trends</CardTitle>
                </div>
                <CardDescription>Last 6 months of expenses with share breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No expense data available for chart.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `$${value.toFixed(2)}`,
                          name === "yourShare" ? "Your Share" : name === "theirShare" ? "Their Share" : "Total",
                        ]}
                      />
                      <Bar dataKey="yourShare" stackId="shares" fill="#0d9488" radius={[0, 0, 0, 0]} name="yourShare" />
                      <Bar dataKey="theirShare" stackId="shares" fill="#94a3b8" radius={[4, 4, 0, 0]} name="theirShare" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Category breakdown pie chart */}
            <Card className="border-none shadow-sm soft-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-teal-600" />
                  <CardTitle className="font-display font-bold">Category Breakdown</CardTitle>
                </div>
                <CardDescription>
                  Where the money goes{selectedMonth !== "all" ? ` (${monthOptions.find((o) => o.value === selectedMonth)?.label})` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No expense data available for chart.
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 min-w-[160px]">
                      {categoryChartData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm">{entry.name}</span>
                          </div>
                          <span className="text-sm font-medium">${entry.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
