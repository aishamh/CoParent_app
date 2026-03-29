import SwiftUI

struct CalendarView: View {
    @State private var viewModel = CalendarViewModel()

    var body: some View {
        Group {
            switch viewModel.state {
            case .loading:
                loadingView
            case .empty:
                emptyView
            case .loaded:
                calendarContent
            case .error(let message):
                errorView(message)
            }
        }
        .navigationTitle("Calendar")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                filterMenu
            }
        }
        .overlay(alignment: .bottomTrailing) {
            createEventButton
        }
        .sheet(isPresented: $viewModel.isShowingCreateSheet) {
            CreateEventView(viewModel: viewModel)
        }
        .task {
            await viewModel.loadEvents()
        }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Loading calendar...")
                .font(.subheadline)
                .foregroundStyle(Color.cpMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.cpBackground)
    }

    // MARK: - Empty

    private var emptyView: some View {
        ContentUnavailableView {
            Label("No Events", systemImage: "calendar.badge.plus")
        } description: {
            Text("Add your first event to start organizing your co-parenting schedule.")
        } actions: {
            Button("Create Event") {
                viewModel.isShowingCreateSheet = true
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
        .background(Color.cpBackground)
    }

    // MARK: - Loaded

    private var calendarContent: some View {
        ScrollView {
            VStack(spacing: 0) {
                monthHeader
                weekdayHeader
                calendarGrid
                selectedDayEvents
            }
        }
        .background(Color.cpBackground)
    }

    // MARK: - Month Navigation

    private var monthHeader: some View {
        HStack {
            Button {
                viewModel.navigateMonth(by: -1)
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Color.cpPrimary)
            }

            Spacer()

            Text(viewModel.monthYearTitle)
                .font(.title3.bold())
                .foregroundStyle(Color.cpForeground)

            Spacer()

            Button {
                viewModel.navigateMonth(by: 1)
            } label: {
                Image(systemName: "chevron.right")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Color.cpPrimary)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
    }

    // MARK: - Weekday Labels

    private var weekdayHeader: some View {
        let symbols = Calendar.current.veryShortWeekdaySymbols
        return HStack(spacing: 0) {
            ForEach(symbols, id: \.self) { symbol in
                Text(symbol)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Color.cpMuted)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 4)
    }

    // MARK: - Calendar Grid

    private var calendarGrid: some View {
        let columns = Array(repeating: GridItem(.flexible(), spacing: 0), count: 7)
        let totalSlots = viewModel.firstWeekdayOffset + viewModel.daysInMonth
        let formatter = CalendarView.gridDateFormatter

        return LazyVGrid(columns: columns, spacing: 4) {
            // Empty cells before month starts
            ForEach(0..<viewModel.firstWeekdayOffset, id: \.self) { _ in
                Color.clear.frame(height: 48)
            }

            // Day cells
            ForEach(1...viewModel.daysInMonth, id: \.self) { day in
                let dateString = dayToDateString(day: day, formatter: formatter)
                let isSelected = isSelectedDay(day)
                let isToday = isTodayDay(day)
                let eventTypes = viewModel.eventTypesForDate(dateString)

                dayCell(
                    day: day,
                    isSelected: isSelected,
                    isToday: isToday,
                    eventTypes: eventTypes
                )
            }

            // Pad remaining slots to fill the last row
            let remainder = totalSlots % 7
            if remainder > 0 {
                ForEach(0..<(7 - remainder), id: \.self) { _ in
                    Color.clear.frame(height: 48)
                }
            }
        }
        .padding(.horizontal, 12)
    }

    private func dayCell(day: Int, isSelected: Bool, isToday: Bool, eventTypes: [EventType]) -> some View {
        Button {
            viewModel.selectDate(day)
        } label: {
            VStack(spacing: 2) {
                Text("\(day)")
                    .font(.system(.body, design: .rounded).weight(isToday ? .bold : .regular))
                    .foregroundStyle(
                        isSelected ? .white :
                        isToday ? Color.cpPrimary :
                        Color.cpForeground
                    )

                // Event type dots
                HStack(spacing: 3) {
                    ForEach(eventTypes.prefix(3)) { type in
                        Circle()
                            .fill(colorForEventType(type))
                            .frame(width: 5, height: 5)
                    }
                }
                .frame(height: 6)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(isSelected ? Color.cpPrimary : Color.clear)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Selected Day Events List

    private var selectedDayEvents: some View {
        VStack(alignment: .leading, spacing: 12) {
            let dayEvents = viewModel.eventsForSelectedDate

            HStack {
                Text(selectedDateTitle)
                    .font(.headline)
                    .foregroundStyle(Color.cpForeground)
                Spacer()
                Text("\(dayEvents.count) event\(dayEvents.count == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(Color.cpMuted)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            if dayEvents.isEmpty {
                Text("No events on this day")
                    .font(.subheadline)
                    .foregroundStyle(Color.cpMuted)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 24)
            } else {
                ForEach(dayEvents) { event in
                    NavigationLink(destination: CalendarEventDetailView(event: event, viewModel: viewModel)) {
                        eventRow(event)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.bottom, 80) // Space for FAB
    }

    private func eventRow(_ event: EventDTO) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 3)
                .fill(colorForEventType(event.eventType))
                .frame(width: 4, height: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.cpForeground)

                HStack(spacing: 6) {
                    if event.isAllDay {
                        Text("All day")
                    } else {
                        Text("\(event.startTime) - \(event.endTime)")
                    }
                    if let location = event.location, !location.isEmpty {
                        Text("| \(location)")
                    }
                }
                .font(.caption)
                .foregroundStyle(Color.cpMuted)
                .lineLimit(1)
            }

            Spacer()

            Image(systemName: event.eventType.iconName)
                .font(.caption)
                .foregroundStyle(colorForEventType(event.eventType))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .padding(.horizontal, 16)
    }

    // MARK: - FAB

    private var createEventButton: some View {
        Button {
            viewModel.isShowingCreateSheet = true
        } label: {
            Image(systemName: "plus")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Color.cpPrimary)
                .clipShape(Circle())
                .shadow(color: Color.cpPrimary.opacity(0.3), radius: 8, y: 4)
        }
        .padding(.trailing, 20)
        .padding(.bottom, 20)
    }

    // MARK: - Filter Menu

    private var filterMenu: some View {
        Menu {
            Button("All Types") {
                viewModel.filterType = nil
            }
            Divider()
            ForEach(EventType.allCases) { type in
                Button {
                    viewModel.filterType = type
                } label: {
                    Label(type.displayName, systemImage: type.iconName)
                }
            }
        } label: {
            Image(systemName: viewModel.filterType == nil ? "line.3.horizontal.decrease.circle" : "line.3.horizontal.decrease.circle.fill")
                .foregroundStyle(Color.cpPrimary)
        }
    }

    // MARK: - Error

    private func errorView(_ message: String) -> some View {
        ContentUnavailableView {
            Label("Something Went Wrong", systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        } actions: {
            Button("Try Again") {
                _Concurrency.Task {
                    await viewModel.loadEvents()
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
        .background(Color.cpBackground)
    }

    // MARK: - Helpers

    private var selectedDateTitle: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: viewModel.selectedDate)
    }

    private func dayToDateString(day: Int, formatter: DateFormatter) -> String {
        guard let date = Calendar.current.date(bySetting: .day, value: day, of: viewModel.firstDayOfMonth) else {
            return ""
        }
        return formatter.string(from: date)
    }

    private func isSelectedDay(_ day: Int) -> Bool {
        let cal = Calendar.current
        return cal.component(.day, from: viewModel.selectedDate) == day
            && cal.isDate(viewModel.selectedDate, equalTo: viewModel.displayedMonth, toGranularity: .month)
    }

    private func isTodayDay(_ day: Int) -> Bool {
        let cal = Calendar.current
        let today = Date.now
        guard let dayDate = cal.date(bySetting: .day, value: day, of: viewModel.firstDayOfMonth) else { return false }
        return cal.isDate(dayDate, inSameDayAs: today)
    }

    private static let gridDateFormatter: DateFormatter = {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        return fmt
    }()
}

// MARK: - Event Type Color

func colorForEventType(_ type: EventType) -> Color {
    switch type {
    case .custody: .cpEventCustody
    case .holiday: .cpEventHoliday
    case .activity: .cpEventActivity
    case .medical: .cpEventMedical
    case .school: .cpEventSchool
    case .travel: .cpParentB
    case .other: .cpMuted
    }
}
