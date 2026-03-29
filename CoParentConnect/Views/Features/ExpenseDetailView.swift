import SwiftUI

struct ExpenseDetailView: View {
    let expense: ExpenseDTO
    @Bindable var viewModel: ExpensesViewModel
    @Environment(AuthService.self) private var auth
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                amountHeader
                detailsCard
                receiptSection
                actionButtons
            }
            .padding()
        }
        .background(Color.cpBackground)
        .navigationTitle("Expense Detail")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Amount Header

    private var amountHeader: some View {
        VStack(spacing: 8) {
            Text(expense.formattedAmount)
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(Color.cpForeground)

            HStack(spacing: 6) {
                Image(systemName: expense.category.icon)
                Text(expense.category.displayName)
            }
            .font(.subheadline)
            .foregroundStyle(Color.cpMuted)

            statusBadge
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }

    private var statusBadge: some View {
        Text(expense.status.displayName)
            .font(.caption.weight(.semibold))
            .foregroundStyle(statusForeground)
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background(statusBackground)
            .cornerRadius(12)
    }

    private var statusForeground: Color {
        switch expense.status {
        case .pending: Color.cpWarning
        case .approved: Color.cpSuccess
        case .reimbursed: Color.cpMuted
        }
    }

    private var statusBackground: Color {
        switch expense.status {
        case .pending: Color.cpWarning.opacity(0.15)
        case .approved: Color.cpSuccess.opacity(0.15)
        case .reimbursed: Color.cpMuted.opacity(0.15)
        }
    }

    // MARK: - Details Card

    private var detailsCard: some View {
        VStack(spacing: 0) {
            detailRow(label: "Description", value: expense.description)
            Divider().padding(.horizontal)
            detailRow(label: "Paid by", value: expense.paidBy == auth.currentUser?.id ? "You" : "Co-parent")
            Divider().padding(.horizontal)
            detailRow(label: "Split", value: splitDescription)
            Divider().padding(.horizontal)
            detailRow(label: "Date", value: formattedDate)
        }
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(Color.cpMuted)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Color.cpForeground)
                .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    private var splitDescription: String {
        switch expense.splitType {
        case .equal:
            return "50/50 split"
        case .custom:
            let pct = expense.splitPercentage ?? 50
            return "\(Int(pct))% / \(Int(100 - pct))%"
        }
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .long
        formatter.timeStyle = .short
        return formatter.string(from: expense.date)
    }

    // MARK: - Receipt Section

    @ViewBuilder
    private var receiptSection: some View {
        if let receiptUrl = expense.receiptUrl, let url = URL(string: receiptUrl) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Receipt")
                    .font(.headline)
                    .foregroundStyle(Color.cpForeground)

                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(maxWidth: .infinity, minHeight: 200)
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                            .cornerRadius(12)
                    case .failure:
                        receiptFallback
                    @unknown default:
                        receiptFallback
                    }
                }
            }
            .padding(16)
            .background(Color(.systemBackground))
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
        }
    }

    private var receiptFallback: some View {
        VStack(spacing: 8) {
            Image(systemName: "doc.text.fill")
                .font(.largeTitle)
                .foregroundStyle(Color.cpMuted)
            Text("Could not load receipt")
                .font(.caption)
                .foregroundStyle(Color.cpMuted)
        }
        .frame(maxWidth: .infinity, minHeight: 120)
        .background(Color.cpPrimary100)
        .cornerRadius(12)
    }

    // MARK: - Action Buttons

    @ViewBuilder
    private var actionButtons: some View {
        let isOtherParent = expense.paidBy != auth.currentUser?.id

        if expense.status == .pending {
            HStack(spacing: 12) {
                Button {
                    _Concurrency.Task {
                        await viewModel.approveExpense(expense)
                        dismiss()
                    }
                } label: {
                    Label("Approve", systemImage: "checkmark.circle")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.cpSuccess)

                if isOtherParent {
                    Button {
                        _Concurrency.Task {
                            await viewModel.reimburseExpense(expense)
                            dismiss()
                        }
                    } label: {
                        Label("Reimburse", systemImage: "dollarsign.circle")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.cpPrimary)
                }
            }
        } else if expense.status == .approved && isOtherParent {
            Button {
                _Concurrency.Task {
                    await viewModel.reimburseExpense(expense)
                    dismiss()
                }
            } label: {
                Label("Mark as Reimbursed", systemImage: "dollarsign.circle")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
    }
}
