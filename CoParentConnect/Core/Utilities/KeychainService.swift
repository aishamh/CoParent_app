import Foundation
import Security

final class KeychainService {
    static let shared = KeychainService()
    private let service = AppConstants.Keychain.service
    private init() {}

    // MARK: - Access Token

    func getAccessToken() -> String? {
        read(account: AppConstants.Keychain.accessToken)
    }

    @discardableResult
    func setAccessToken(_ token: String) -> Bool {
        save(token, account: AppConstants.Keychain.accessToken,
             accessibility: kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
    }

    // MARK: - Refresh Token

    func getRefreshToken() -> String? {
        read(account: AppConstants.Keychain.refreshToken)
    }

    @discardableResult
    func setRefreshToken(_ token: String) -> Bool {
        save(token, account: AppConstants.Keychain.refreshToken,
             accessibility: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly)
    }

    // MARK: - Apple User ID

    func getAppleUserId() -> String? {
        read(account: AppConstants.Keychain.appleUserId)
    }

    @discardableResult
    func setAppleUserId(_ id: String) -> Bool {
        save(id, account: AppConstants.Keychain.appleUserId,
             accessibility: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly)
    }

    // MARK: - Clear All

    func clearAll() {
        delete(account: AppConstants.Keychain.accessToken)
        delete(account: AppConstants.Keychain.refreshToken)
        delete(account: AppConstants.Keychain.appleUserId)
    }

    // MARK: - Private Helpers

    private func save(_ value: String, account: String, accessibility: CFString) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }
        delete(account: account)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            kSecAttrAccessible as String: accessibility,
        ]
        return SecItemAdd(query as CFDictionary, nil) == errSecSuccess
    }

    private func read(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }
        return string
    }

    @discardableResult
    private func delete(account: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}
