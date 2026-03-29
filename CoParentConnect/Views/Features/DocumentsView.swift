import SwiftUI
import PDFKit

struct DocumentsView: View {
    @State private var viewModel = DocumentsViewModel()
    @State private var showUpload = false
    @State private var selectedDocument: DocumentDTO?

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Group {
                if viewModel.isLoading && viewModel.documents.isEmpty {
                    loadingState
                } else if let error = viewModel.errorMessage, viewModel.documents.isEmpty {
                    errorState(error)
                } else if viewModel.documents.isEmpty {
                    emptyState
                } else {
                    loadedState
                }
            }

            // FAB — upload document
            Button {
                showUpload = true
            } label: {
                Image(systemName: "plus")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.cpPrimary)
                    .clipShape(Circle())
                    .shadow(color: Color.cpPrimary.opacity(0.3), radius: 8, y: 4)
            }
            .padding(24)
        }
        .background(Color.cpBackground)
        .navigationTitle("Documents")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showUpload) {
            UploadDocumentView(viewModel: viewModel)
        }
        .sheet(item: $selectedDocument) { doc in
            DocumentPreviewSheet(document: doc)
        }
        .task {
            await viewModel.loadDocuments()
        }
    }

    // MARK: - Loading

    private var loadingState: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(Color.cpPrimary)
            Text("Loading documents...")
                .font(.subheadline)
                .foregroundStyle(Color.cpMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error

    private func errorState(_ message: String) -> some View {
        ContentUnavailableView {
            Label("Something went wrong", systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        } actions: {
            Button("Try Again") {
                _Concurrency.Task {
                    await viewModel.loadDocuments()
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
    }

    // MARK: - Empty

    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Documents", systemImage: "doc.text")
        } description: {
            Text("Store and share important documents with your co-parent. Tap + to upload.")
        } actions: {
            Button("Upload Document") {
                showUpload = true
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
    }

    // MARK: - Loaded

    private var loadedState: some View {
        ScrollView {
            VStack(spacing: 16) {
                categoryFilterChips
                documentGrid
            }
            .padding(.vertical)
        }
        .refreshable {
            await viewModel.loadDocuments()
        }
    }

    // MARK: - Category Filter Chips

    private var categoryFilterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chipButton(title: "All", isSelected: viewModel.selectedCategory == nil) {
                    viewModel.selectedCategory = nil
                }

                ForEach(DocumentCategory.allCases) { category in
                    chipButton(
                        title: category.displayName,
                        isSelected: viewModel.selectedCategory == category
                    ) {
                        viewModel.selectedCategory = category
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private func chipButton(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(isSelected ? .white : Color.cpForeground)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.cpPrimary : Color(.systemBackground))
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isSelected ? Color.clear : Color.cpBorder, lineWidth: 1)
                )
        }
    }

    // MARK: - Document Grid

    private var documentGrid: some View {
        LazyVStack(spacing: 0, pinnedViews: [.sectionHeaders]) {
            ForEach(viewModel.groupedByCategory, id: \.category) { group in
                Section {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))], spacing: 12) {
                        ForEach(group.docs) { doc in
                            DocumentCardView(document: doc) {
                                selectedDocument = doc
                            }
                            .contextMenu {
                                Button(role: .destructive) {
                                    _Concurrency.Task {
                                        await viewModel.deleteDocument(doc)
                                    }
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 12)
                } header: {
                    HStack(spacing: 6) {
                        Image(systemName: group.category.icon)
                            .foregroundStyle(Color.cpPrimary)
                        Text(group.category.displayName)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.cpMuted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                    .background(Color.cpBackground)
                }
            }
        }
    }
}

// MARK: - Document Card

struct DocumentCardView: View {
    let document: DocumentDTO
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                Image(systemName: document.fileType.icon)
                    .font(.largeTitle)
                    .foregroundStyle(Color.cpPrimary)
                    .frame(height: 50)

                Text(document.title)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(Color.cpForeground)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)

                Text(document.formattedDate)
                    .font(.caption2)
                    .foregroundStyle(Color.cpMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(12)
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.04), radius: 6, y: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Document Preview Sheet

struct DocumentPreviewSheet: View {
    let document: DocumentDTO
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if let url = URL(string: document.fileUrl) {
                    switch document.fileType {
                    case .pdf:
                        PDFPreviewView(url: url)
                    case .image:
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .empty:
                                ProgressView()
                            case .success(let image):
                                image
                                    .resizable()
                                    .scaledToFit()
                            case .failure:
                                previewFallback
                            @unknown default:
                                previewFallback
                            }
                        }
                    case .doc:
                        previewFallback
                    }
                } else {
                    previewFallback
                }
            }
            .navigationTitle(document.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    if let url = URL(string: document.fileUrl) {
                        ShareLink(item: url) {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
            }
        }
    }

    private var previewFallback: some View {
        ContentUnavailableView {
            Label("Preview Unavailable", systemImage: "eye.slash")
        } description: {
            Text("This document type cannot be previewed in-app.")
        }
    }
}

// MARK: - PDF Preview (UIKit bridge)

struct PDFPreviewView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.autoScales = true
        _Concurrency.Task {
            if let data = try? await URLSession.shared.data(from: url).0,
               let document = PDFDocument(data: data) {
                await MainActor.run {
                    pdfView.document = document
                }
            }
        }
        return pdfView
    }

    func updateUIView(_ uiView: PDFView, context: Context) {}
}
