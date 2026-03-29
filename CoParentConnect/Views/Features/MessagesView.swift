import SwiftUI

struct MessagesView: View {
    @State private var viewModel = MessagesViewModel()
    @Environment(AuthService.self) private var auth

    var body: some View {
        Group {
            switch viewModel.state {
            case .loading:
                loadingView
            case .empty:
                emptyView
            case .loaded:
                chatContent
            case .error(let message):
                errorView(message)
            }
        }
        .navigationTitle("Chat")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadMessages()
        }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Loading messages...")
                .font(.subheadline)
                .foregroundStyle(Color.cpMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.cpBackground)
    }

    // MARK: - Empty

    private var emptyView: some View {
        VStack(spacing: 24) {
            Spacer()
            ContentUnavailableView {
                Label("No Messages", systemImage: "bubble.left.and.bubble.right")
            } description: {
                Text("Start a conversation with your co-parent. Keep it respectful and focused on the kids.")
            }
            Spacer()
            inputBar
        }
        .background(Color.cpBackground)
    }

    // MARK: - Chat Content

    private var chatContent: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(viewModel.sortedMessages) { message in
                            messageBubble(message)
                                .id(message.id)
                                .task {
                                    await viewModel.loadMoreIfNeeded(currentMessage: message)
                                    await viewModel.markAsRead(message)
                                }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                }
                .onChange(of: viewModel.messages.count) {
                    scrollToBottom(proxy: proxy)
                }
                .onAppear {
                    scrollToBottom(proxy: proxy)
                }
            }

            toneWarningBanner

            inputBar
        }
        .background(Color.cpBackground)
    }

    // MARK: - Message Bubble

    private func messageBubble(_ message: MessageDTO) -> some View {
        let isCurrentUser = message.senderId == auth.currentUser?.id
        let bubbleColor: Color = isCurrentUser ? .cpParentA : .cpParentB

        return HStack(alignment: .bottom, spacing: 8) {
            if isCurrentUser { Spacer(minLength: 48) }

            VStack(alignment: isCurrentUser ? .trailing : .leading, spacing: 4) {
                if !isCurrentUser {
                    Text(senderDisplayName(for: message))
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(Color.cpMuted)
                }

                Text(message.content)
                    .font(.body)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleColor)
                    .clipShape(RoundedRectangle(cornerRadius: 18))

                HStack(spacing: 4) {
                    Text(formatMessageTime(message.createdAt))
                        .font(.caption2)
                        .foregroundStyle(Color.cpMuted)

                    if message.isToneFlagged {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption2)
                            .foregroundStyle(Color.cpWarning)
                    }

                    if isCurrentUser && message.isRead {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption2)
                            .foregroundStyle(Color.cpSuccess)
                    }
                }
            }

            if !isCurrentUser { Spacer(minLength: 48) }
        }
    }

    // MARK: - Tone Warning

    @ViewBuilder
    private var toneWarningBanner: some View {
        if let warning = viewModel.toneWarning {
            HStack(spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(Color.cpWarning)
                Text(warning)
                    .font(.caption)
                    .foregroundStyle(Color.cpForeground)
                Spacer()
                Button {
                    viewModel.toneWarning = nil
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Color.cpMuted)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.cpWarning.opacity(0.1))
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Message...", text: $viewModel.draftText, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color(.systemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(Color.cpBorder, lineWidth: 1)
                )

            Button {
                _Concurrency.Task {
                    await sendMessage()
                }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title)
                    .foregroundStyle(
                        canSend ? Color.cpPrimary : Color.cpMuted
                    )
            }
            .disabled(!canSend)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
    }

    // MARK: - Error

    private func errorView(_ message: String) -> some View {
        ContentUnavailableView {
            Label("Something Went Wrong", systemImage: "exclamationmark.triangle")
        } description: {
            Text(message)
        } actions: {
            Button("Try Again") {
                _Concurrency.Task {
                    await viewModel.loadMessages()
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.cpPrimary)
        }
        .background(Color.cpBackground)
    }

    // MARK: - Helpers

    private var canSend: Bool {
        !viewModel.draftText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !viewModel.isSending
    }

    private func sendMessage() async {
        // For now, use the first family member who isn't the current user as receiver.
        // In a full implementation, this would come from a conversation/thread model.
        let receiverId = determineReceiverId()
        await viewModel.checkTone()

        // If tone is flagged, let the user see the warning and decide
        guard viewModel.toneWarning == nil else { return }
        await viewModel.sendMessage(receiverId: receiverId)
    }

    private func determineReceiverId() -> String {
        // Find the other participant from existing messages
        let currentUserId = auth.currentUser?.id ?? ""
        let otherParticipant = viewModel.messages.first {
            $0.senderId != currentUserId
        }
        return otherParticipant?.senderId ?? currentUserId
    }

    private func senderDisplayName(for message: MessageDTO) -> String {
        if message.senderId == auth.currentUser?.id {
            return "You"
        }
        // Use parent names from user profile if available
        return auth.currentUser?.parentBName ?? "Co-Parent"
    }

    private func formatMessageTime(_ isoString: String) -> String {
        let isoFormatter = ISO8601DateFormatter()
        guard let date = isoFormatter.date(from: isoString) else {
            return ""
        }

        let formatter = DateFormatter()
        let calendar = Calendar.current
        if calendar.isDateInToday(date) {
            formatter.dateFormat = "h:mm a"
        } else if calendar.isDateInYesterday(date) {
            return "Yesterday"
        } else {
            formatter.dateFormat = "MMM d"
        }
        return formatter.string(from: date)
    }

    private func scrollToBottom(proxy: ScrollViewProxy) {
        guard let lastId = viewModel.sortedMessages.last?.id else { return }
        withAnimation(.easeOut(duration: 0.2)) {
            proxy.scrollTo(lastId, anchor: .bottom)
        }
    }
}
