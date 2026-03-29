import SwiftUI

struct CalendarEventDetailView: View {
    let event: EventDTO
    let viewModel: CalendarViewModel

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteConfirmation = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                headerSection
                dateTimeSection
                if event.location != nil || event.address != nil {
                    locationSection
                }
                if let description = event.description, !description.isEmpty {
                    notesSection(description)
                }
                detailsSection
                deleteButton
            }
            .padding(20)
        }
        .background(Color.cpBackground)
        .navigationTitle("Event Details")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Delete Event", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                _Concurrency.Task {
                    await viewModel.deleteEvent(event)
                    dismiss()
                }
            }
        } message: {
            Text("Are you sure you want to delete \"\(event.title)\"? This action cannot be undone.")
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack(spacing: 12) {
            Image(systemName: event.eventType.iconName)
                .font(.title2)
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(colorForEventType(event.eventType))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.title2.bold())
                    .foregroundStyle(Color.cpForeground)

                Text(event.eventType.displayName)
                    .font(.subheadline)
                    .foregroundStyle(colorForEventType(event.eventType))
            }
        }
    }

    // MARK: - Date & Time

    private var dateTimeSection: some View {
        detailCard {
            VStack(spacing: 12) {
                detailRow(
                    icon: "calendar",
                    title: "Start",
                    value: formatDateDisplay(event.startDate, time: event.startTime)
                )
                Divider()
                detailRow(
                    icon: "calendar.badge.clock",
                    title: "End",
                    value: formatDateDisplay(event.endDate, time: event.endTime)
                )
                if event.isAllDay {
                    Divider()
                    detailRow(icon: "clock.fill", title: "Duration", value: "All Day")
                }
            }
        }
    }

    // MARK: - Location

    private var locationSection: some View {
        detailCard {
            VStack(spacing: 12) {
                if let location = event.location, !location.isEmpty {
                    detailRow(icon: "mappin.circle.fill", title: "Location", value: location)
                }
                if let address = event.address, !address.isEmpty {
                    if event.location != nil { Divider() }
                    detailRow(icon: "map.fill", title: "Address", value: fullAddress)
                }
            }
        }
    }

    private var fullAddress: String {
        [event.address, event.city, event.postalCode]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }

    // MARK: - Notes

    private func notesSection(_ notes: String) -> some View {
        detailCard {
            VStack(alignment: .leading, spacing: 8) {
                Label("Notes", systemImage: "note.text")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Color.cpMuted)

                Text(notes)
                    .font(.body)
                    .foregroundStyle(Color.cpForeground)
            }
        }
    }

    // MARK: - Details

    private var detailsSection: some View {
        detailCard {
            VStack(spacing: 12) {
                detailRow(icon: "person.fill", title: "Created by", value: event.parent)
                if let recurrence = event.recurrence, !recurrence.isEmpty {
                    Divider()
                    detailRow(icon: "repeat", title: "Recurrence", value: recurrence.capitalized)
                }
            }
        }
    }

    // MARK: - Delete

    private var deleteButton: some View {
        Button(role: .destructive) {
            showDeleteConfirmation = true
        } label: {
            HStack {
                Image(systemName: "trash")
                Text("Delete Event")
            }
            .font(.body.weight(.medium))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.cpDestructive.opacity(0.1))
            .foregroundStyle(Color.cpDestructive)
            .cornerRadius(12)
        }
        .padding(.top, 8)
    }

    // MARK: - Reusable Components

    private func detailCard<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading) {
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }

    private func detailRow(icon: String, title: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(Color.cpPrimary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(Color.cpMuted)
                Text(value)
                    .font(.subheadline)
                    .foregroundStyle(Color.cpForeground)
            }
        }
    }

    // MARK: - Helpers

    private func formatDateDisplay(_ dateString: String, time: String) -> String {
        let inputFormatter = DateFormatter()
        inputFormatter.dateFormat = "yyyy-MM-dd"
        inputFormatter.locale = Locale(identifier: "en_US_POSIX")

        guard let date = inputFormatter.date(from: dateString) else { return dateString }

        let outputFormatter = DateFormatter()
        outputFormatter.dateStyle = .medium

        if time == "00:00" || time == "23:59" {
            return outputFormatter.string(from: date)
        }
        return "\(outputFormatter.string(from: date)) at \(time)"
    }
}
