import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct UploadDocumentView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var viewModel: DocumentsViewModel

    @State private var title = ""
    @State private var category: DocumentCategory = .other
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var fileData: Data?
    @State private var fileName: String?
    @State private var detectedFileType: DocumentFileType = .image
    @State private var showFilePicker = false
    @State private var sourceSelection: SourceSelection?

    enum SourceSelection: Identifiable {
        case photo, file
        var id: Int { hashValue }
    }

    var body: some View {
        NavigationStack {
            Form {
                titleSection
                categorySection
                fileSourceSection
                filePreviewSection
            }
            .navigationTitle("Upload Document")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Upload") {
                        upload()
                    }
                    .disabled(!isValid || viewModel.isUploading)
                    .fontWeight(.semibold)
                }
            }
            .overlay {
                if viewModel.isUploading {
                    uploadingOverlay
                }
            }
            .onChange(of: selectedPhoto) { _, newValue in
                handlePhotoSelection(newValue)
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.pdf, .png, .jpeg, .heic],
                allowsMultipleSelection: false
            ) { result in
                handleFileImport(result)
            }
        }
    }

    // MARK: - Sections

    private var titleSection: some View {
        Section("Title") {
            TextField("Document name", text: $title)
                .textInputAutocapitalization(.words)
        }
    }

    private var categorySection: some View {
        Section("Category") {
            Picker("Category", selection: $category) {
                ForEach(DocumentCategory.allCases) { cat in
                    Label(cat.displayName, systemImage: cat.icon)
                        .tag(cat)
                }
            }
            .pickerStyle(.menu)
        }
    }

    private var fileSourceSection: some View {
        Section("File") {
            PhotosPicker(
                selection: $selectedPhoto,
                matching: .images,
                photoLibrary: .shared()
            ) {
                Label("Choose from Photos", systemImage: "photo.on.rectangle")
                    .foregroundStyle(Color.cpPrimary)
            }

            Button {
                showFilePicker = true
            } label: {
                Label("Choose File (PDF, Image)", systemImage: "doc.badge.plus")
                    .foregroundStyle(Color.cpPrimary)
            }
        }
    }

    @ViewBuilder
    private var filePreviewSection: some View {
        if let fileData, let fileName {
            Section("Selected File") {
                HStack(spacing: 12) {
                    Image(systemName: detectedFileType.icon)
                        .font(.title2)
                        .foregroundStyle(Color.cpPrimary)
                        .frame(width: 44, height: 44)
                        .background(Color.cpPrimary100)
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(fileName)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(Color.cpForeground)
                            .lineLimit(1)
                        Text(formattedFileSize(fileData.count))
                            .font(.caption)
                            .foregroundStyle(Color.cpMuted)
                    }

                    Spacer()

                    Button {
                        clearSelection()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(Color.cpMuted)
                    }
                }

                if detectedFileType == .image, let uiImage = UIImage(data: fileData) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 200)
                        .cornerRadius(8)
                }
            }
        }
    }

    private var uploadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
            VStack(spacing: 16) {
                ProgressView()
                    .tint(.white)
                    .scaleEffect(1.2)
                Text("Uploading...")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.white)
            }
            .padding(24)
            .background(.ultraThinMaterial)
            .cornerRadius(16)
        }
    }

    // MARK: - Validation & Upload

    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty && fileData != nil
    }

    private func upload() {
        guard let fileData else { return }

        _Concurrency.Task {
            let success = await viewModel.uploadDocument(
                title: title.trimmingCharacters(in: .whitespaces),
                category: category,
                fileData: fileData,
                fileType: detectedFileType
            )
            if success {
                await MainActor.run { dismiss() }
            }
        }
    }

    // MARK: - File Handling

    private func handlePhotoSelection(_ item: PhotosPickerItem?) {
        guard let item else { return }

        _Concurrency.Task {
            if let data = try? await item.loadTransferable(type: Data.self) {
                await MainActor.run {
                    fileData = data
                    fileName = "photo_\(Date().timeIntervalSince1970).jpg"
                    detectedFileType = .image
                }
            }
        }
    }

    private func handleFileImport(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }
            let accessing = url.startAccessingSecurityScopedResource()
            defer { if accessing { url.stopAccessingSecurityScopedResource() } }

            if let data = try? Data(contentsOf: url) {
                fileData = data
                fileName = url.lastPathComponent

                let ext = url.pathExtension.lowercased()
                if ext == "pdf" {
                    detectedFileType = .pdf
                } else if ["jpg", "jpeg", "png", "heic"].contains(ext) {
                    detectedFileType = .image
                } else {
                    detectedFileType = .doc
                }
            }
        case .failure:
            viewModel.errorMessage = "Could not import file"
        }
    }

    private func clearSelection() {
        fileData = nil
        fileName = nil
        selectedPhoto = nil
    }

    private func formattedFileSize(_ bytes: Int) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(bytes))
    }
}
