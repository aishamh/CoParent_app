import Foundation

@Observable
final class ExpensesViewModel {

    // MARK: - State

    var expenses: [ExpenseDTO] = []
    var isLoading = false
    var errorMessage: String?
    var selectedCategory: ExpenseCategory?

    private let api = APIClient.shared
    private var currentPage = 1
    private var hasMorePages = true

    // MARK: - Computed

    /// Expenses filtered by the active category chip.
    var filteredExpenses: [ExpenseDTO] {
        guard let category = selectedCategory else { return expenses }
        return expenses.filter { $0.category == category }
    }

    /// Expenses grouped by month-year, sorted newest first.
    var groupedByMonth: [(key: String, expenses: [ExpenseDTO])] {
        let grouped = Dictionary(grouping: filteredExpenses, by: \.monthYearKey)
        return grouped
            .map { (key: $0.key, expenses: $0.value.sorted { $0.date > $1.date }) }
            .sorted { ($0.expenses.first?.date ?? .distantPast) > ($1.expenses.first?.date ?? .distantPast) }
    }

    /// Total of all loaded expenses.
    var totalAmount: Double {
        expenses.reduce(0) { $0 + $1.amount }
    }

    /// Calculate how much the current user owes or is owed.
    /// Returns a positive value when the other parent owes the current user,
    /// negative when the current user owes the other parent.
    func balanceForUser(_ userId: String) -> Double {
        var balance: Double = 0

        for expense in expenses where expense.status != .reimbursed {
            let owedShare = owedShareAmount(for: expense)

            if expense.paidBy == userId {
                // Current user paid -- other parent owes them this share
                balance += owedShare
            } else {
                // Other parent paid -- current user owes them this share
                balance -= owedShare
            }
        }

        return balance
    }

    /// Monthly total for the current filter.
    var currentMonthTotal: Double {
        let now = Date()
        let calendar = Calendar.current
        return filteredExpenses
            .filter { calendar.isDate($0.date, equalTo: now, toGranularity: .month) }
            .reduce(0) { $0 + $1.amount }
    }

    // MARK: - Actions

    func loadExpenses() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        currentPage = 1

        do {
            let response: PaginatedResponse<ExpenseDTO> = try await api.request(.expenses(page: 1))
            await MainActor.run {
                expenses = response.data
                hasMorePages = response.pagination.page < response.pagination.totalPages
                isLoading = false
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }

    func loadMore() async {
        guard !isLoading, hasMorePages else { return }
        isLoading = true
        currentPage += 1

        do {
            let response: PaginatedResponse<ExpenseDTO> = try await api.request(.expenses(page: currentPage))
            await MainActor.run {
                expenses.append(contentsOf: response.data)
                hasMorePages = response.pagination.page < response.pagination.totalPages
                isLoading = false
            }
        } catch {
            await MainActor.run {
                currentPage -= 1
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }

    func createExpense(_ request: CreateExpenseRequest) async -> Bool {
        do {
            let created: ExpenseDTO = try await api.request(.createExpense, body: request)
            await MainActor.run {
                expenses.insert(created, at: 0)
            }
            return true
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
            }
            return false
        }
    }

    func deleteExpense(_ expense: ExpenseDTO) async {
        do {
            try await api.requestVoid(.deleteExpense(id: expense.id))
            await MainActor.run {
                expenses.removeAll { $0.id == expense.id }
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
            }
        }
    }

    func approveExpense(_ expense: ExpenseDTO) async {
        await updateExpenseStatus(expense, body: ["status": ExpenseStatus.approved.rawValue])
    }

    func reimburseExpense(_ expense: ExpenseDTO) async {
        await updateExpenseStatus(expense, body: ["status": ExpenseStatus.reimbursed.rawValue])
    }

    // MARK: - Helpers

    private func owedShareAmount(for expense: ExpenseDTO) -> Double {
        switch expense.splitType {
        case .equal:
            return expense.amount / 2.0
        case .custom:
            let percentage = expense.splitPercentage ?? 50.0
            return expense.amount * (percentage / 100.0)
        }
    }

    private func updateExpenseStatus(_ expense: ExpenseDTO, body: [String: String]) async {
        do {
            let updated: ExpenseDTO = try await api.request(
                .updateExpense(id: expense.id),
                body: body
            )
            await MainActor.run {
                if let index = expenses.firstIndex(where: { $0.id == expense.id }) {
                    expenses[index] = updated
                }
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
            }
        }
    }
}
