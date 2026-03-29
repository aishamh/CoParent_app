import Foundation

@Observable
final class MessagesViewModel {
    var messages: [MessageDTO] = []
    var state: ViewState = .loading
    var unreadCount: Int = 0
    var draftText: String = ""
    var isSending = false
    var toneWarning: String?

    private let api = APIClient.shared
    private var currentPage = 1
    private var totalPages = 1
    private var cursor: String?
    private var isLoadingMore = false

    // MARK: - Computed

    /// Messages sorted oldest-first for chat display.
    var sortedMessages: [MessageDTO] {
        messages.sorted {
            ($0.createdDate ?? .distantPast) < ($1.createdDate ?? .distantPast)
        }
    }

    // MARK: - Load Messages

    func loadMessages() async {
        state = .loading
        currentPage = 1
        cursor = nil
        await fetchPage()
        await fetchUnreadCount()
    }

    func loadMoreIfNeeded(currentMessage: MessageDTO) async {
        guard !isLoadingMore, currentPage < totalPages else { return }

        // Trigger load when near the top (oldest messages)
        let sorted = sortedMessages
        guard let index = sorted.firstIndex(where: { $0.id == currentMessage.id }),
              index < 5 else { return }

        isLoadingMore = true
        currentPage += 1
        await fetchPage()
        isLoadingMore = false
    }

    // MARK: - Send Message

    func sendMessage(receiverId: String, subject: String? = nil) async {
        let content = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty else { return }

        isSending = true
        toneWarning = nil

        do {
            let request = SendMessageRequest(
                receiverId: receiverId,
                content: content,
                subject: subject
            )
            let sent: MessageDTO = try await api.request(.sendMessage, body: request)
            messages.append(sent)
            draftText = ""
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }

        isSending = false
    }

    // MARK: - Tone Check

    func checkTone() async {
        let content = draftText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty else { return }

        do {
            let response: ToneCheckResponse = try await api.request(
                .toneCheck,
                body: ToneCheckRequest(content: content)
            )
            if response.score < 0.5 {
                toneWarning = response.suggestion ?? "Consider rephrasing for a more neutral tone."
            } else {
                toneWarning = nil
            }
        } catch {
            // Tone check is non-critical; silently fail
        }
    }

    // MARK: - Mark Read

    func markAsRead(_ message: MessageDTO) async {
        guard !message.isRead else { return }

        do {
            try await api.requestVoid(.markRead(id: message.id))
            if let index = messages.firstIndex(where: { $0.id == message.id }) {
                // Optimistic update: replace with a read copy
                // The next full refresh will sync the actual server state
                await fetchUnreadCount()
                _ = index // Acknowledged; server is source of truth
            }
        } catch {
            // Non-critical; next refresh will sync
        }
    }

    // MARK: - Unread Count

    func fetchUnreadCount() async {
        do {
            let response: UnreadCountResponse = try await api.request(.unreadCount)
            unreadCount = response.count
        } catch {
            // Non-critical
        }
    }

    // MARK: - Private

    private func fetchPage() async {
        do {
            let response: PaginatedResponse<MessageDTO> = try await api.request(
                .messages(page: currentPage, cursor: cursor)
            )

            if currentPage == 1 {
                messages = response.data
            } else {
                // Prepend older messages, deduplicating by ID
                let existingIds = Set(messages.map(\.id))
                let newMessages = response.data.filter { !existingIds.contains($0.id) }
                messages.insert(contentsOf: newMessages, at: 0)
            }

            totalPages = response.pagination.totalPages

            // Use the oldest message's createdAt as cursor for next page
            if let oldest = response.data.last {
                cursor = oldest.createdAt
            }

            state = messages.isEmpty ? .empty : .loaded
        } catch {
            if messages.isEmpty {
                state = .error(error.localizedDescription)
            }
        }
    }
}
