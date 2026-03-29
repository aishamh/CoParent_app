import Foundation

// MARK: - Expense Category

enum ExpenseCategory: String, Codable, CaseIterable, Identifiable {
    case groceries
    case medical
    case education
    case activities
    case clothing
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .groceries: "Groceries"
        case .medical: "Medical"
        case .education: "Education"
        case .activities: "Activities"
        case .clothing: "Clothing"
        case .other: "Other"
        }
    }

    var icon: String {
        switch self {
        case .groceries: "cart.fill"
        case .medical: "cross.case.fill"
        case .education: "book.fill"
        case .activities: "figure.run"
        case .clothing: "tshirt.fill"
        case .other: "ellipsis.circle.fill"
        }
    }
}

// MARK: - Split Type

enum SplitType: String, Codable, CaseIterable, Identifiable {
    case equal
    case custom

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .equal: "50/50"
        case .custom: "Custom"
        }
    }
}

// MARK: - Expense Status

enum ExpenseStatus: String, Codable, CaseIterable, Identifiable {
    case pending
    case approved
    case reimbursed

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .pending: "Pending"
        case .approved: "Approved"
        case .reimbursed: "Reimbursed"
        }
    }
}

// MARK: - Expense DTO

struct ExpenseDTO: Codable, Identifiable, Equatable {
    let id: Int
    let description: String
    let amount: Double
    let category: ExpenseCategory
    let paidBy: String
    let splitType: SplitType
    let splitPercentage: Double?
    let receiptUrl: String?
    let status: ExpenseStatus
    let familyId: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, description, amount, category, status
        case paidBy = "paid_by"
        case splitType = "split_type"
        case splitPercentage = "split_percentage"
        case receiptUrl = "receipt_url"
        case familyId = "family_id"
        case createdAt = "created_at"
    }

    /// Formatted amount as currency string.
    var formattedAmount: String {
        Self.currencyFormatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }

    /// Parsed creation date for grouping and sorting.
    var date: Date {
        ISO8601DateFormatter().date(from: createdAt) ?? Date()
    }

    /// Month-year key for section grouping (e.g. "March 2026").
    var monthYearKey: String {
        Self.monthYearFormatter.string(from: date)
    }

    // MARK: - Shared Formatters

    private static let currencyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale.current
        return formatter
    }()

    private static let monthYearFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter
    }()
}

// MARK: - Create Expense Request

struct CreateExpenseRequest: Encodable {
    let description: String
    let amount: Double
    let category: ExpenseCategory
    let paidBy: String
    let splitType: SplitType
    let splitPercentage: Double?
    let receiptUrl: String?

    enum CodingKeys: String, CodingKey {
        case description, amount, category
        case paidBy = "paid_by"
        case splitType = "split_type"
        case splitPercentage = "split_percentage"
        case receiptUrl = "receipt_url"
    }
}
