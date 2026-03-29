import Foundation
import SwiftData

@Model
final class CPUser {
    @Attribute(.unique) var id: String
    var username: String
    var email: String?
    var displayName: String?
    var role: String
    var familyId: String?
    var avatarUrl: String?
    var parentAName: String?
    var parentBName: String?
    var venmoUsername: String?
    var paypalEmail: String?
    var createdAt: String

    init(
        id: String,
        username: String,
        email: String? = nil,
        displayName: String? = nil,
        role: String = "parent_a",
        familyId: String? = nil,
        avatarUrl: String? = nil,
        parentAName: String? = nil,
        parentBName: String? = nil,
        venmoUsername: String? = nil,
        paypalEmail: String? = nil,
        createdAt: String = ISO8601DateFormatter().string(from: Date())
    ) {
        self.id = id
        self.username = username
        self.email = email
        self.displayName = displayName
        self.role = role
        self.familyId = familyId
        self.avatarUrl = avatarUrl
        self.parentAName = parentAName
        self.parentBName = parentBName
        self.venmoUsername = venmoUsername
        self.paypalEmail = paypalEmail
        self.createdAt = createdAt
    }
}
