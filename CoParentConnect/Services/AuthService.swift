import Foundation
import AuthenticationServices

enum AuthState: Equatable {
    case loading
    case unauthenticated
    case needsOnboarding
    case authenticated
}

@Observable
final class AuthService {
    static let shared = AuthService()

    var state: AuthState = .loading
    var currentUser: UserDTO?
    var errorMessage: String?

    private let api = APIClient.shared
    private let keychain = KeychainService.shared

    private init() {
        api.onSessionExpired = { [weak self] in
            self?.handleSessionExpired()
        }
    }

    // MARK: - Session Restore

    func checkExistingAuth() async {
        // Check Apple credential state if we have an Apple user ID
        if let appleId = keychain.getAppleUserId() {
            let provider = ASAuthorizationAppleIDProvider()
            let credentialState = try? await provider.credentialState(forUserID: appleId)
            if credentialState != .authorized {
                handleSessionExpired()
                return
            }
        }

        // Try to fetch profile with existing token
        guard keychain.getAccessToken() != nil else {
            await MainActor.run { state = .unauthenticated }
            return
        }

        do {
            let user: UserDTO = try await api.request(.profile)
            await MainActor.run {
                currentUser = user
                state = user.familyId != nil ? .authenticated : .needsOnboarding
            }
        } catch {
            await MainActor.run { state = .unauthenticated }
        }
    }

    // MARK: - Email/Password Auth

    func signIn(username: String, password: String) async {
        errorMessage = nil
        do {
            let response: AuthResponse = try await api.request(
                .login,
                body: LoginRequest(username: username, password: password)
            )
            storeTokens(access: response.token, refresh: response.refreshToken)
            await MainActor.run {
                currentUser = response.user
                state = response.user.familyId != nil ? .authenticated : .needsOnboarding
            }
        } catch let error as APIError {
            await MainActor.run { errorMessage = error.errorDescription }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
        }
    }

    func signUp(username: String, password: String, email: String?, displayName: String?, role: String) async {
        errorMessage = nil
        do {
            let response: AuthResponse = try await api.request(
                .register,
                body: RegisterRequest(
                    username: username,
                    password: password,
                    email: email,
                    displayName: displayName,
                    role: role
                )
            )
            storeTokens(access: response.token, refresh: response.refreshToken)
            await MainActor.run {
                currentUser = response.user
                state = .needsOnboarding
            }
        } catch let error as APIError {
            await MainActor.run { errorMessage = error.errorDescription }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
        }
    }

    // MARK: - Apple Sign In

    func handleAppleSignIn(result: Result<ASAuthorization, Error>) async {
        errorMessage = nil

        guard case .success(let authorization) = result,
              let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let identityTokenData = credential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            await MainActor.run { errorMessage = "Apple Sign In failed" }
            return
        }

        let email = credential.email
        let displayName: String? = {
            guard let fullName = credential.fullName else { return nil }
            let parts = [fullName.givenName, fullName.familyName].compactMap { $0 }
            return parts.isEmpty ? nil : parts.joined(separator: " ")
        }()

        do {
            let response: AppleAuthResponse = try await api.request(
                .appleSignIn,
                body: AppleSignInRequest(
                    identityToken: identityToken,
                    userIdentifier: credential.user,
                    email: email,
                    displayName: displayName
                )
            )

            keychain.setAppleUserId(credential.user)
            storeTokens(access: response.token, refresh: response.refreshToken)

            await MainActor.run {
                currentUser = response.user
                if response.isNewUser {
                    state = .needsOnboarding
                } else {
                    state = response.user.familyId != nil ? .authenticated : .needsOnboarding
                }
            }
        } catch let error as APIError {
            await MainActor.run { errorMessage = error.errorDescription }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
        }
    }

    // MARK: - Sign Out

    func signOut() async {
        try? await api.requestVoid(.logout)
        keychain.clearAll()
        await MainActor.run {
            currentUser = nil
            state = .unauthenticated
        }
    }

    // MARK: - Helpers

    private func storeTokens(access: String, refresh: String?) {
        keychain.setAccessToken(access)
        if let refresh {
            keychain.setRefreshToken(refresh)
        }
    }

    private func handleSessionExpired() {
        keychain.clearAll()
        Task { @MainActor in
            currentUser = nil
            state = .unauthenticated
        }
    }
}
