import Foundation
import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

@Observable
final class DocumentsViewModel {

    // MARK: - State

    var documents: [DocumentDTO] = []
    var isLoading = false
    var isUploading = false
    var errorMessage: String?
    var selectedCategory: DocumentCategory?

    private let api = APIClient.shared

    // MARK: - Computed

    /// Documents filtered by the active category chip.
    var filteredDocuments: [DocumentDTO] {
        guard let category = selectedCategory else { return documents }
        return documents.filter { $0.category == category }
    }

    /// Documents grouped by category, sorted alphabetically.
    var groupedByCategory: [(category: DocumentCategory, docs: [DocumentDTO])] {
        let grouped = Dictionary(grouping: filteredDocuments, by: \.category)
        return grouped
            .map { (category: $0.key, docs: $0.value.sorted { $0.date > $1.date }) }
            .sorted { $0.category.displayName < $1.category.displayName }
    }

    // MARK: - Actions

    func loadDocuments() async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil

        do {
            let response: [DocumentDTO] = try await api.request(.documents)
            await MainActor.run {
                documents = response
                isLoading = false
            }
        } catch {
            // Try paginated fallback
            do {
                let response: PaginatedResponse<DocumentDTO> = try await api.request(.documents)
                await MainActor.run {
                    documents = response.data
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }

    func uploadDocument(title: String, category: DocumentCategory, fileData: Data, fileType: DocumentFileType) async -> Bool {
        isUploading = true
        errorMessage = nil

        do {
            let uploaded = try await uploadMultipart(
                title: title,
                category: category,
                fileData: fileData,
                fileType: fileType
            )
            await MainActor.run {
                documents.insert(uploaded, at: 0)
                isUploading = false
            }
            return true
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                isUploading = false
            }
            return false
        }
    }

    func deleteDocument(_ document: DocumentDTO) async {
        do {
            try await api.requestVoid(.deleteDocument(id: document.id))
            await MainActor.run {
                documents.removeAll { $0.id == document.id }
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Multipart Upload

    private func uploadMultipart(
        title: String,
        category: DocumentCategory,
        fileData: Data,
        fileType: DocumentFileType
    ) async throws -> DocumentDTO {
        let boundary = "Boundary-\(UUID().uuidString)"
        let baseURL = AppConstants.apiBaseURL

        guard let url = URL(string: baseURL + APIEndpoint.uploadDocument.path) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let token = KeychainService.shared.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()
        let fields: [(String, String)] = [
            ("title", title),
            ("category", category.rawValue),
            ("file_type", fileType.rawValue)
        ]

        for (key, value) in fields {
            body.appendMultipart("--\(boundary)\r\n")
            body.appendMultipart("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n")
            body.appendMultipart("\(value)\r\n")
        }

        let mimeType = mimeTypeFor(fileType)
        let filename = filenameFor(title: title, fileType: fileType)

        body.appendMultipart("--\(boundary)\r\n")
        body.appendMultipart("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n")
        body.appendMultipart("Content-Type: \(mimeType)\r\n\r\n")
        body.append(fileData)
        body.appendMultipart("\r\n")
        body.appendMultipart("--\(boundary)--\r\n")

        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw APIError.httpError(status: status, message: "Upload failed")
        }

        return try JSONDecoder().decode(DocumentDTO.self, from: data)
    }

    private func mimeTypeFor(_ fileType: DocumentFileType) -> String {
        switch fileType {
        case .pdf: return "application/pdf"
        case .image: return "image/jpeg"
        case .doc: return "application/octet-stream"
        }
    }

    private func filenameFor(title: String, fileType: DocumentFileType) -> String {
        let sanitized = title.replacingOccurrences(of: " ", with: "_").lowercased()
        switch fileType {
        case .pdf: return "\(sanitized).pdf"
        case .image: return "\(sanitized).jpg"
        case .doc: return "\(sanitized).doc"
        }
    }
}

// MARK: - Data Multipart Helper

private extension Data {
    mutating func appendMultipart(_ string: String) {
        if let data = string.data(using: .utf8) {
            append(data)
        }
    }
}
