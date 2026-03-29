import SwiftUI

struct CreateEventView: View {
    let viewModel: CalendarViewModel

    @Environment(\.dismiss) private var dismiss
    @Environment(AuthService.self) private var auth

    @State private var title = ""
    @State private var selectedType: EventType = .activity
    @State private var startDate = Date.now
    @State private var endDate = Date.now.addingTimeInterval(3600)
    @State private var isAllDay = false
    @State private var location = ""
    @State private var notes = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                titleSection
                typeSection
                dateSection
                locationSection
                notesSection
                if let errorMessage {
                    errorSection(errorMessage)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.cpBackground)
            .navigationTitle("New Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        _Concurrency.Task { await save() }
                    }
                    .disabled(!isValid || isSaving)
                    .fontWeight(.semibold)
                }
            }
        }
    }

    // MARK: - Sections

    private var titleSection: some View {
        Section {
            TextField("Event title", text: $title)
                .font(.body)
        } header: {
            Text("Title")
        }
    }

    private var typeSection: some View {
        Section {
            Picker("Event Type", selection: $selectedType) {
                ForEach(EventType.allCases) { type in
                    Label(type.displayName, systemImage: type.iconName)
                        .tag(type)
                }
            }
            .pickerStyle(.menu)
            .tint(colorForEventType(selectedType))
        } header: {
            Text("Type")
        }
    }

    private var dateSection: some View {
        Section {
            Toggle("All Day", isOn: $isAllDay)

            if isAllDay {
                DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                DatePicker("End Date", selection: $endDate, displayedComponents: .date)
            } else {
                DatePicker("Start", selection: $startDate)
                DatePicker("End", selection: $endDate)
            }
        } header: {
            Text("Date & Time")
        }
    }

    private var locationSection: some View {
        Section {
            TextField("Location (optional)", text: $location)
                .font(.body)
        } header: {
            Text("Location")
        }
    }

    private var notesSection: some View {
        Section {
            TextField("Notes (optional)", text: $notes, axis: .vertical)
                .lineLimit(3...6)
                .font(.body)
        } header: {
            Text("Notes")
        }
    }

    private func errorSection(_ message: String) -> some View {
        Section {
            Text(message)
                .font(.caption)
                .foregroundStyle(Color.cpDestructive)
        }
    }

    // MARK: - Validation

    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty && endDate >= startDate
    }

    // MARK: - Save

    private func save() async {
        isSaving = true
        errorMessage = nil

        let parentName = auth.currentUser?.displayName
            ?? auth.currentUser?.username
            ?? "Parent"

        await viewModel.createEvent(
            title: title.trimmingCharacters(in: .whitespaces),
            type: selectedType,
            startDate: startDate,
            endDate: endDate,
            location: location.isEmpty ? nil : location,
            notes: notes.isEmpty ? nil : notes,
            parent: parentName
        )

        isSaving = false
        dismiss()
    }
}
