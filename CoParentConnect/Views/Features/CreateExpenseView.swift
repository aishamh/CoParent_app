import SwiftUI

struct CreateExpenseView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var viewModel: ExpensesViewModel
    let currentUserId: String

    @State private var description = ""
    @State private var amountText = ""
    @State private var category: ExpenseCategory = .groceries
    @State private var paidByMe = true
    @State private var splitType: SplitType = .equal
    @State private var splitPercentage: Double = 50
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                descriptionSection
                amountSection
                categorySection
                paidBySection
                splitSection
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("New Expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save()
                    }
                    .disabled(!isValid || isSaving)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    // MARK: - Sections

    private var descriptionSection: some View {
        Section("Description") {
            TextField("What was this expense for?", text: $description)
                .textInputAutocapitalization(.sentences)
        }
    }

    private var amountSection: some View {
        Section("Amount") {
            HStack {
                Text("$")
                    .font(.title2.bold())
                    .foregroundStyle(Color.cpForeground)
                TextField("0.00", text: $amountText)
                    .keyboardType(.decimalPad)
                    .font(.title2.bold())
            }
        }
    }

    private var categorySection: some View {
        Section("Category") {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 90))], spacing: 12) {
                ForEach(ExpenseCategory.allCases) { cat in
                    categoryChip(cat)
                }
            }
            .padding(.vertical, 4)
        }
    }

    private func categoryChip(_ cat: ExpenseCategory) -> some View {
        let isSelected = category == cat
        return Button {
            category = cat
        } label: {
            VStack(spacing: 6) {
                Image(systemName: cat.icon)
                    .font(.title3)
                Text(cat.displayName)
                    .font(.caption2.weight(.medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .foregroundStyle(isSelected ? .white : Color.cpForeground)
            .background(isSelected ? Color.cpPrimary : Color.cpPrimary100)
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }

    private var paidBySection: some View {
        Section("Who paid?") {
            Picker("Paid by", selection: $paidByMe) {
                Text("Me").tag(true)
                Text("Co-parent").tag(false)
            }
            .pickerStyle(.segmented)
        }
    }

    private var splitSection: some View {
        Section("Split") {
            Picker("Split type", selection: $splitType) {
                ForEach(SplitType.allCases) { type in
                    Text(type.displayName).tag(type)
                }
            }
            .pickerStyle(.segmented)

            if splitType == .custom {
                VStack(spacing: 8) {
                    Slider(value: $splitPercentage, in: 0...100, step: 5)
                        .tint(Color.cpPrimary)
                    HStack {
                        Text("You: \(Int(splitPercentage))%")
                            .font(.caption)
                            .foregroundStyle(Color.cpParentA)
                        Spacer()
                        Text("Them: \(Int(100 - splitPercentage))%")
                            .font(.caption)
                            .foregroundStyle(Color.cpParentB)
                    }
                }
            }
        }
    }

    // MARK: - Validation & Save

    private var isValid: Bool {
        !description.trimmingCharacters(in: .whitespaces).isEmpty
        && parsedAmount > 0
    }

    private var parsedAmount: Double {
        Double(amountText) ?? 0
    }

    private func save() {
        guard isValid else { return }
        isSaving = true

        let request = CreateExpenseRequest(
            description: description.trimmingCharacters(in: .whitespaces),
            amount: parsedAmount,
            category: category,
            paidBy: paidByMe ? currentUserId : "coparent",
            splitType: splitType,
            splitPercentage: splitType == .custom ? splitPercentage : nil,
            receiptUrl: nil
        )

        _Concurrency.Task {
            let success = await viewModel.createExpense(request)
            if success {
                await MainActor.run { dismiss() }
            } else {
                await MainActor.run { isSaving = false }
            }
        }
    }
}
