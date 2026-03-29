import Foundation

enum AppConstants {
    static let apiBaseURL = "https://co-parent-app-mu.vercel.app"
    static let bundleID = "com.coparent.connect"
    static let appName = "CoParent Connect"

    enum Keychain {
        static let service = "com.coparent.connect"
        static let accessToken = "com.coparent.connect.access_token"
        static let refreshToken = "com.coparent.connect.refresh_token"
        static let appleUserId = "com.coparent.connect.apple_user_id"
    }
}
