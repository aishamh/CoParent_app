import Foundation

enum HTTPMethod: String {
    case GET, POST, PUT, PATCH, DELETE
}

enum APIEndpoint {
    // Auth
    case login
    case register
    case appleSignIn
    case refreshToken
    case logout
    case profile

    // Family
    case family
    case createFamily
    case joinFamily(code: String)
    case familyMembers

    // Children
    case children
    case createChild
    case updateChild(id: Int)
    case deleteChild(id: Int)

    // Events
    case events(page: Int)
    case createEvent
    case updateEvent(id: Int)
    case deleteEvent(id: Int)

    // Messages
    case messages(page: Int, cursor: String?)
    case sendMessage
    case toneCheck
    case markRead(id: String)
    case unreadCount

    // Expenses
    case expenses(page: Int)
    case createExpense
    case updateExpense(id: Int)
    case deleteExpense(id: Int)

    // Documents
    case documents
    case uploadDocument
    case deleteDocument(id: Int)

    // Notifications
    case registerDevice
    case notificationPreferences
    case updateNotificationPreferences

    var path: String {
        switch self {
        case .login: "/api/auth/login"
        case .register: "/api/auth/register"
        case .appleSignIn: "/api/auth/apple"
        case .refreshToken: "/api/auth/refresh"
        case .logout: "/api/auth/logout"
        case .profile: "/api/auth/profile"
        case .family: "/api/family"
        case .createFamily: "/api/family"
        case .joinFamily(let code): "/api/family/join/\(code)"
        case .familyMembers: "/api/family/members"
        case .children: "/api/children"
        case .createChild: "/api/children"
        case .updateChild(let id): "/api/children/\(id)"
        case .deleteChild(let id): "/api/children/\(id)"
        case .events(let page): "/api/events?page=\(page)"
        case .createEvent: "/api/events"
        case .updateEvent(let id): "/api/events/\(id)"
        case .deleteEvent(let id): "/api/events/\(id)"
        case .messages(let page, let cursor):
            if let cursor {
                "/api/messages?page=\(page)&cursor=\(cursor)"
            } else {
                "/api/messages?page=\(page)"
            }
        case .sendMessage: "/api/messages"
        case .toneCheck: "/api/messages/tone-check"
        case .markRead(let id): "/api/messages/\(id)/read"
        case .unreadCount: "/api/messages/unread-count"
        case .expenses(let page): "/api/expenses?page=\(page)"
        case .createExpense: "/api/expenses"
        case .updateExpense(let id): "/api/expenses/\(id)"
        case .deleteExpense(let id): "/api/expenses/\(id)"
        case .documents: "/api/documents"
        case .uploadDocument: "/api/documents"
        case .deleteDocument(let id): "/api/documents/\(id)"
        case .registerDevice: "/api/notifications/device-token"
        case .notificationPreferences: "/api/notifications/preferences"
        case .updateNotificationPreferences: "/api/notifications/preferences"
        }
    }

    var method: HTTPMethod {
        switch self {
        case .login, .register, .appleSignIn, .refreshToken, .logout,
             .createFamily, .joinFamily, .createChild, .createEvent,
             .sendMessage, .toneCheck, .createExpense, .uploadDocument,
             .registerDevice:
            .POST
        case .updateChild, .updateEvent, .updateExpense, .updateNotificationPreferences:
            .PUT
        case .markRead:
            .PATCH
        case .deleteChild, .deleteEvent, .deleteExpense, .deleteDocument:
            .DELETE
        default:
            .GET
        }
    }
}
