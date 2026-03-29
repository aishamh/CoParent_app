import Foundation

// MARK: - Message DTO

struct MessageDTO: Codable, Identifiable, Equatable {
    let id: String
    let familyId: String
    let senderId: String
    let receiverId: String
    let subject: String?
    let content: String
    let isRead: Bool
    let readAt: String?
    let toneScore: String?
    let toneOverridden: Bool
    let attachmentUrl: String?
    let attachmentType: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, subject, content
        case familyId = "family_id"
        case senderId = "sender_id"
        case receiverId = "receiver_id"
        case isRead = "is_read"
        case readAt = "read_at"
        case toneScore = "tone_score"
        case toneOverridden = "tone_overridden"
        case attachmentUrl = "attachment_url"
        case attachmentType = "attachment_type"
        case createdAt = "created_at"
    }

    /// Parses `createdAt` ISO 8601 string into a `Date`.
    var createdDate: Date? {
        ISO8601DateFormatter().date(from: createdAt)
    }

    /// Whether the tone score indicates a flagged message.
    var isToneFlagged: Bool {
        guard let score = toneScore, let value = Double(score) else { return false }
        return value < 0.5
    }
}

// MARK: - Send Message Request

struct SendMessageRequest: Encodable {
    let receiverId: String
    let content: String
    let subject: String?

    enum CodingKeys: String, CodingKey {
        case content, subject
        case receiverId = "receiver_id"
    }
}

// MARK: - Unread Count Response

struct UnreadCountResponse: Decodable {
    let count: Int
}

// MARK: - Tone Check

struct ToneCheckRequest: Encodable {
    let content: String
}

struct ToneCheckResponse: Decodable {
    let score: Double
    let suggestion: String?
}
