import Foundation

// MARK: - Event Type

enum EventType: String, Codable, CaseIterable, Identifiable {
    case custody
    case holiday
    case activity
    case travel
    case medical
    case school
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .custody: "Custody"
        case .holiday: "Holiday"
        case .activity: "Activity"
        case .travel: "Travel"
        case .medical: "Medical"
        case .school: "School"
        case .other: "Other"
        }
    }

    var iconName: String {
        switch self {
        case .custody: "person.2.fill"
        case .holiday: "gift.fill"
        case .activity: "figure.run"
        case .travel: "airplane"
        case .medical: "cross.case.fill"
        case .school: "book.fill"
        case .other: "calendar"
        }
    }
}

// MARK: - Event DTO

struct EventDTO: Codable, Identifiable, Equatable {
    let id: Int
    let familyId: String
    let childId: Int?
    let title: String
    let startDate: String
    let endDate: String
    let startTime: String
    let endTime: String
    let timeZone: String
    let parent: String
    let type: String
    let recurrence: String?
    let recurrenceInterval: Int
    let recurrenceEnd: String?
    let recurrenceDays: String?
    let description: String?
    let location: String?
    let address: String?
    let city: String?
    let postalCode: String?
    let scheduleId: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, title, parent, type, recurrence, description, location, address, city
        case familyId = "family_id"
        case childId = "child_id"
        case startDate = "start_date"
        case endDate = "end_date"
        case startTime = "start_time"
        case endTime = "end_time"
        case timeZone = "time_zone"
        case recurrenceInterval = "recurrence_interval"
        case recurrenceEnd = "recurrence_end"
        case recurrenceDays = "recurrence_days"
        case postalCode = "postal_code"
        case scheduleId = "schedule_id"
        case createdAt = "created_at"
    }

    var eventType: EventType {
        EventType(rawValue: type) ?? .other
    }

    /// Parses `startDate` (yyyy-MM-dd) + `startTime` (HH:mm) into a `Date`.
    var startDateTime: Date? {
        Self.dateTimeFormatter.date(from: "\(startDate) \(startTime)")
    }

    /// Parses `endDate` (yyyy-MM-dd) + `endTime` (HH:mm) into a `Date`.
    var endDateTime: Date? {
        Self.dateTimeFormatter.date(from: "\(endDate) \(endTime)")
    }

    /// Parses just the `startDate` string into a calendar `Date`.
    var startCalendarDate: Date? {
        Self.dateOnlyFormatter.date(from: startDate)
    }

    var isAllDay: Bool {
        startTime == "00:00" && endTime == "23:59"
    }

    private static let dateTimeFormatter: DateFormatter = {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd HH:mm"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        return fmt
    }()

    private static let dateOnlyFormatter: DateFormatter = {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        return fmt
    }()
}

// MARK: - Create Event Request

struct CreateEventRequest: Encodable {
    let title: String
    let startDate: String
    let endDate: String
    let startTime: String
    let endTime: String
    let parent: String
    let type: String
    let description: String?
    let location: String?

    enum CodingKeys: String, CodingKey {
        case title, parent, type, description, location
        case startDate = "start_date"
        case endDate = "end_date"
        case startTime = "start_time"
        case endTime = "end_time"
    }
}
