import Foundation

// MARK: - Requests

struct LoginRequest: Encodable {
    let username: String
    let password: String
}

struct RegisterRequest: Encodable {
    let username: String
    let password: String
    let email: String?
    let displayName: String?
    let role: String
}

struct AppleSignInRequest: Encodable {
    let identityToken: String
    let userIdentifier: String
    let email: String?
    let displayName: String?
}

struct RefreshTokenRequest: Encodable {
    let refreshToken: String
}

// MARK: - Responses

struct AuthResponse: Decodable {
    let token: String
    let refreshToken: String?
    let user: UserDTO
}

struct AppleAuthResponse: Decodable {
    let token: String
    let refreshToken: String
    let user: UserDTO
    let isNewUser: Bool
}

struct RefreshResponse: Decodable {
    let token: String
    let refreshToken: String
}

struct UserDTO: Decodable {
    let id: String
    let username: String
    let email: String?
    let displayName: String?
    let role: String
    let familyId: String?
    let avatarUrl: String?
    let parentAName: String?
    let parentBName: String?
    let venmoUsername: String?
    let paypalEmail: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, username, email, role
        case displayName = "display_name"
        case familyId = "family_id"
        case avatarUrl = "avatar_url"
        case parentAName = "parent_a_name"
        case parentBName = "parent_b_name"
        case venmoUsername = "venmo_username"
        case paypalEmail = "paypal_email"
        case createdAt = "created_at"
    }
}

// MARK: - DTO → SwiftData Mapping

extension UserDTO {
    func toCPUser() -> CPUser {
        CPUser(
            id: id,
            username: username,
            email: email,
            displayName: displayName,
            role: role,
            familyId: familyId,
            avatarUrl: avatarUrl,
            parentAName: parentAName,
            parentBName: parentBName,
            venmoUsername: venmoUsername,
            paypalEmail: paypalEmail,
            createdAt: createdAt
        )
    }
}
