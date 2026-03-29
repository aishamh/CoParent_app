import SwiftUI

struct ExpensesView: View {
    @Environment(AuthService.self) private var auth
    @State private var viewModel = ExpensesViewModel()
    @State private var showCreateExpense = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Group {
                if viewModel.isLoading && viewModel.expenses.isEmpty {
                    loadingState
                } else if let error = viewModel.errorMessage, viewModel.expenses.isEmpty {
                    errorState(error)
                } else if viewModel.expenses.isEmpty {
                    emptyState
                } else {
                    loadedState
                }
            }

            // FAB — add expense
            Button {
                showCreateExpense = true
            } label: {
                Image(systemName: "plus")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.cpPrimary)
                    .clipShape(Circle())
                    .shadow(color: Color.cpPrimary.opacity(0.3), radius: 8, y: 4)
            }
            .padding(24)
        }
        .background(Color.cpBackground)
        .navigationTitle("Expenses")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showCreateExpense) {
            CreateExpenseView(viewModel: viewModel, currentUserId: auth.currentUser?.id ?? "")
        }
        .task {
            await viewModel.loadExpenses()
        }
    }

    // MARK: - Loading

    private var loadingState: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(Color.cpPrimary)
            Text("Loading expenses...")
                .font(.subheadline)
                .foregroundStyle(Color.cpMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error

    private func errorState(_ message: String) -> some View {
        ContentUnavailableView {
            Label("Something went wrong", systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        } actions: {
            Button("Try Again") {
                _Concurrency.Task {
                    await viewModel.loadExpenses()
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
    }

    // MARK: - Empty

    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Expenses Yet", systemImage: "creditcard")
        } description: {
            Text("Track shared expenses with your co-parent. Tap + to add the first one.")
        } actions: {
            Button("Add Expense") {
                showCreateExpense = true
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
    }

    // MARK: - Loaded

    private var loadedState: some View {
        ScrollView {
            VStack(spacing: 16) {
                balanceSummaryCard
                categoryFilterChips
                expenseList
            }
            .padding(.vertical)
        }
        .refreshable {
            await viewModel.loadExpenses()
        }
    }

    // MARK: - Balance Summary

    private var balanceSummaryCard: some View {
        let userId = auth.currentUser?.id ?? ""
        let balance = viewModel.balanceForUser(userId)
        let monthTotal = viewModel.currentMonthTotal

        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Balance")
                        .font(.caption)
                        .foregroundStyle(Color.cpMuted)
                    if balance > 0 {
                        Text("They owe you")
                            .font(.subheadline)
                            .foregroundStyle(Color.cpSuccess)
                        Text(formatCurrency(balance))
                            .font(.title.bold())
                            .foregroundStyle(Color.cpSuccess)
                    } else if balance < 0 {
                        Text("You owe")
                            .font(.subheadline)
                            .foregroundStyle(Color.cpDestructive)
                        Text(formatCurrency(abs(balance)))
                            .font(.title.bold())
                            .foregroundStyle(Color.cpDestructive)
                    } else {
                        Text("All settled up")
                            .font(.subheadline)
                            .foregroundStyle(Color.cpMuted)
                        Text("$0.00")
                            .font(.title.bold())
                            .foregroundStyle(Color.cpForeground)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("This Month")
                        .font(.caption)
                        .foregroundStyle(Color.cpMuted)
                    Text(formatCurrency(monthTotal))
                        .font(.title3.bold())
                        .foregroundStyle(Color.cpForeground)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
        .padding(.horizontal)
    }

    // MARK: - Category Filter Chips

    private var categoryFilterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chipButton(title: "All", isSelected: viewModel.selectedCategory == nil) {
                    viewModel.selectedCategory = nil
                }

                ForEach(ExpenseCategory.allCases) { category in
                    chipButton(
                        title: category.displayName,
                        isSelected: viewModel.selectedCategory == category
                    ) {
                        viewModel.selectedCategory = category
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private func chipButton(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(isSelected ? .white : Color.cpForeground)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.cpPrimary : Color(.systemBackground))
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isSelected ? Color.clear : Color.cpBorder, lineWidth: 1)
                )
        }
    }

    // MARK: - Expense List

    private var expenseList: some View {
        LazyVStack(spacing: 0, pinnedViews: [.sectionHeaders]) {
            ForEach(viewModel.groupedByMonth, id: \.key) { group in
                Section {
                    ForEach(group.expenses) { expense in
                        NavigationLink(destination: ExpenseDetailView(expense: expense, viewModel: viewModel)) {
                            ExpenseRowView(expense: expense, currentUserId: auth.currentUser?.id ?? "")
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button(role: .destructive) {
                                _Concurrency.Task {
                                    await viewModel.deleteExpense(expense)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    Text(group.key)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.cpMuted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .background(Color.cpBackground)
                }
            }

            if viewModel.isLoading {
                ProgressView()
                    .padding()
            }
        }
    }

    // MARK: - Helpers

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale.current
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

// MARK: - Expense Row

struct ExpenseRowView: View {
    let expense: ExpenseDTO
    let currentUserId: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: expense.category.icon)
                .font(.title3)
                .foregroundStyle(Color.cpPrimary)
                .frame(width: 40, height: 40)
                .background(Color.cpPrimary100)
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(expense.description)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.cpForeground)
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Text(expense.category.displayName)
                        .font(.caption)
                        .foregroundStyle(Color.cpMuted)
                    Circle()
                        .fill(Color.cpMuted.opacity(0.4))
                        .frame(width: 3, height: 3)
                    Text(expense.status.displayName)
                        .font(.caption)
                        .foregroundStyle(statusColor(expense.status))
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(expense.formattedAmount)
                    .font(.subheadline.bold())
                    .foregroundStyle(Color.cpForeground)
                Text(expense.paidBy == currentUserId ? "You paid" : "They paid")
                    .font(.caption)
                    .foregroundStyle(Color.cpMuted)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(Color(.systemBackground))
    }

    private func statusColor(_ status: ExpenseStatus) -> Color {
        switch status {
        case .pending: Color.cpWarning
        case .approved: Color.cpSuccess
        case .reimbursed: Color.cpMuted
        }
    }
}
