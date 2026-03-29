import Foundation

// MARK: - Document File Type

enum DocumentFileType: String, Codable, CaseIterable, Identifiable {
    case pdf
    case image
    case doc

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .pdf: "PDF"
        case .image: "Image"
        case .doc: "Document"
        }
    }

    var icon: String {
        switch self {
        case .pdf: "doc.richtext"
        case .image: "photo"
        case .doc: "doc.text"
        }
    }
}

// MARK: - Document Category

enum DocumentCategory: String, Codable, CaseIterable, Identifiable {
    case legal
    case medical
    case school
    case financial
    case other

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .legal: "Legal"
        case .medical: "Medical"
        case .school: "School"
        case .financial: "Financial"
        case .other: "Other"
        }
    }

    var icon: String {
        switch self {
        case .legal: "scale.3d"
        case .medical: "cross.case.fill"
        case .school: "graduationcap.fill"
        case .financial: "dollarsign.circle.fill"
        case .other: "folder.fill"
        }
    }
}

// MARK: - Document DTO

struct DocumentDTO: Codable, Identifiable, Equatable {
    let id: Int
    let title: String
    let fileUrl: String
    let fileType: DocumentFileType
    let category: DocumentCategory
    let uploadedBy: String
    let familyId: String
    let sharedWith: [String]
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, title, category
        case fileUrl = "file_url"
        case fileType = "file_type"
        case uploadedBy = "uploaded_by"
        case familyId = "family_id"
        case sharedWith = "shared_with"
        case createdAt = "created_at"
    }

    /// Parsed creation date for sorting.
    var date: Date {
        ISO8601DateFormatter().date(from: createdAt) ?? Date()
    }

    /// Short formatted date (e.g. "Mar 15, 2026").
    var formattedDate: String {
        Self.shortDateFormatter.string(from: date)
    }

    private static let shortDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
}

// MARK: - Upload Document Request

struct UploadDocumentRequest: Encodable {
    let title: String
    let fileType: DocumentFileType
    let category: DocumentCategory

    enum CodingKeys: String, CodingKey {
        case title, category
        case fileType = "file_type"
    }
}
