import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(status: Int, message: String)
    case sessionExpired
    case decodingError(Error)
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Invalid URL"
        case .invalidResponse: "Invalid server response"
        case .httpError(let status, let message): "HTTP \(status): \(message)"
        case .sessionExpired: "Session expired. Please sign in again."
        case .decodingError(let error): "Decoding error: \(error.localizedDescription)"
        case .networkError(let error): "Network error: \(error.localizedDescription)"
        }
    }
}

struct PaginatedResponse<T: Decodable>: Decodable {
    let data: [T]
    let pagination: Pagination

    struct Pagination: Decodable {
        let page: Int
        let limit: Int
        let total: Int
        let totalPages: Int
    }
}

@Observable
final class APIClient {
    static let shared = APIClient()

    var onSessionExpired: (() -> Void)?

    private let baseURL = AppConstants.apiBaseURL
    private let keychain = KeychainService.shared
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    /// Mutex for token refresh — concurrent 401s share the same refresh task
    private var refreshTask: Task<Bool, Never>?

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        session = URLSession(configuration: config)

        decoder = JSONDecoder()
        encoder = JSONEncoder()
    }

    // MARK: - Public API

    func request<T: Decodable>(_ endpoint: APIEndpoint, body: (any Encodable)? = nil) async throws -> T {
        let data = try await performRequest(endpoint, body: body)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    func requestVoid(_ endpoint: APIEndpoint, body: (any Encodable)? = nil) async throws {
        _ = try await performRequest(endpoint, body: body)
    }

    // MARK: - Core Request Logic

    private func performRequest(_ endpoint: APIEndpoint, body: (any Encodable)? = nil) async throws -> Data {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = keychain.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        // On 401, attempt silent refresh then retry once
        if httpResponse.statusCode == 401 && !isRefreshEndpoint(endpoint) {
            let refreshed = await silentRefresh()

            if refreshed {
                return try await retryWithNewToken(url: url, endpoint: endpoint, body: body)
            }

            // Refresh failed — session truly expired
            await MainActor.run { onSessionExpired?() }
            throw APIError.sessionExpired
        }

        if !(200..<300).contains(httpResponse.statusCode) {
            let message = parseErrorMessage(from: data)
            throw APIError.httpError(status: httpResponse.statusCode, message: message)
        }

        return data
    }

    // MARK: - Token Refresh

    private func silentRefresh() async -> Bool {
        // If a refresh is already in progress, wait for it
        if let existing = refreshTask {
            return await existing.value
        }

        let task = Task<Bool, Never> {
            defer { refreshTask = nil }

            guard let refreshToken = keychain.getRefreshToken() else { return false }

            guard let url = URL(string: baseURL + APIEndpoint.refreshToken.path) else { return false }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let body = RefreshTokenRequest(refreshToken: refreshToken)
            request.httpBody = try? encoder.encode(body)

            guard let (data, response) = try? await session.data(for: request),
                  let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200,
                  let tokenResponse = try? decoder.decode(RefreshResponse.self, from: data) else {
                keychain.clearAll()
                return false
            }

            keychain.setAccessToken(tokenResponse.token)
            keychain.setRefreshToken(tokenResponse.refreshToken)
            return true
        }

        refreshTask = task
        return await task.value
    }

    // MARK: - Helpers

    private func retryWithNewToken(url: URL, endpoint: APIEndpoint, body: (any Encodable)?) async throws -> Data {
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = keychain.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if httpResponse.statusCode == 401 {
            keychain.clearAll()
            await MainActor.run { onSessionExpired?() }
            throw APIError.sessionExpired
        }

        if !(200..<300).contains(httpResponse.statusCode) {
            let message = parseErrorMessage(from: data)
            throw APIError.httpError(status: httpResponse.statusCode, message: message)
        }

        return data
    }

    private func isRefreshEndpoint(_ endpoint: APIEndpoint) -> Bool {
        if case .refreshToken = endpoint { return true }
        return false
    }

    private func parseErrorMessage(from data: Data) -> String {
        struct ErrorBody: Decodable {
            let error: String?
            let message: String?
        }
        if let body = try? decoder.decode(ErrorBody.self, from: data) {
            return body.error ?? body.message ?? "Request failed"
        }
        return String(data: data, encoding: .utf8) ?? "Request failed"
    }
}
