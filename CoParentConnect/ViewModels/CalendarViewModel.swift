import Foundation
import SwiftUI

// MARK: - View State

enum ViewState: Equatable {
    case loading
    case empty
    case loaded
    case error(String)
}

// MARK: - Calendar View Model

@Observable
final class CalendarViewModel {
    var events: [EventDTO] = []
    var selectedDate: Date = .now
    var displayedMonth: Date = .now
    var state: ViewState = .loading
    var filterType: EventType?
    var isShowingCreateSheet = false

    private let api = APIClient.shared
    private let calendar = Calendar.current
    private var currentPage = 1
    private var totalPages = 1

    // MARK: - Computed

    /// Events filtered by the optional type filter.
    var filteredEvents: [EventDTO] {
        guard let filterType else { return events }
        return events.filter { $0.eventType == filterType }
    }

    /// Events for the currently selected date.
    var eventsForSelectedDate: [EventDTO] {
        let dateString = Self.apiDateFormatter.string(from: selectedDate)
        return filteredEvents.filter { $0.startDate == dateString }
    }

    /// Set of dates in the displayed month that have events (for dot indicators).
    var datesWithEvents: Set<String> {
        Set(filteredEvents.map(\.startDate))
    }

    /// First day of the displayed month.
    var firstDayOfMonth: Date {
        calendar.date(from: calendar.dateComponents([.year, .month], from: displayedMonth)) ?? displayedMonth
    }

    /// Number of days in the displayed month.
    var daysInMonth: Int {
        calendar.range(of: .day, in: .month, for: displayedMonth)?.count ?? 30
    }

    /// Weekday offset (0 = Sunday) for the first day of the month.
    var firstWeekdayOffset: Int {
        let weekday = calendar.component(.weekday, from: firstDayOfMonth)
        return weekday - 1
    }

    var monthYearTitle: String {
        Self.monthYearFormatter.string(from: displayedMonth)
    }

    // MARK: - Actions

    func loadEvents() async {
        state = .loading
        currentPage = 1
        await fetchPage(currentPage)
    }

    func loadMoreIfNeeded() async {
        guard currentPage < totalPages else { return }
        currentPage += 1
        await fetchPage(currentPage)
    }

    func navigateMonth(by offset: Int) {
        guard let newMonth = calendar.date(byAdding: .month, value: offset, to: displayedMonth) else { return }
        displayedMonth = newMonth
    }

    func selectDate(_ day: Int) {
        guard let date = calendar.date(
            bySetting: .day,
            value: day,
            of: firstDayOfMonth
        ) else { return }
        selectedDate = date
    }

    func createEvent(title: String, type: EventType, startDate: Date, endDate: Date, location: String?, notes: String?, parent: String) async {
        let request = CreateEventRequest(
            title: title,
            startDate: Self.apiDateFormatter.string(from: startDate),
            endDate: Self.apiDateFormatter.string(from: endDate),
            startTime: Self.apiTimeFormatter.string(from: startDate),
            endTime: Self.apiTimeFormatter.string(from: endDate),
            parent: parent,
            type: type.rawValue,
            description: notes,
            location: location
        )

        do {
            let _: EventDTO = try await api.request(.createEvent, body: request)
            await loadEvents()
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func deleteEvent(_ event: EventDTO) async {
        do {
            try await api.requestVoid(.deleteEvent(id: event.id))
            events.removeAll { $0.id == event.id }
            if events.isEmpty {
                state = .empty
            }
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// Returns the event types present on a given date string for dot coloring.
    func eventTypesForDate(_ dateString: String) -> [EventType] {
        let types = filteredEvents
            .filter { $0.startDate == dateString }
            .map(\.eventType)
        return Array(Set(types)).sorted { $0.rawValue < $1.rawValue }
    }

    // MARK: - Private

    private func fetchPage(_ page: Int) async {
        do {
            let response: PaginatedResponse<EventDTO> = try await api.request(.events(page: page))
            if page == 1 {
                events = response.data
            } else {
                events.append(contentsOf: response.data)
            }
            totalPages = response.pagination.totalPages
            state = events.isEmpty ? .empty : .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    // MARK: - Formatters

    private static let apiDateFormatter: DateFormatter = {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        return fmt
    }()

    private static let apiTimeFormatter: DateFormatter = {
        let fmt = DateFormatter()
        fmt.dateFormat = "HH:mm"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        return fmt
    }()

    private static let monthYearFormatter: DateFormatter = {
        let fmt = DateFormatter()
        fmt.dateFormat = "MMMM yyyy"
        return fmt
    }()
}
