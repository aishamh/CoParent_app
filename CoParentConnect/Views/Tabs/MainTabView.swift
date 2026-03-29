import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView()
            }
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(0)

            NavigationStack {
                CalendarPlaceholderView()
            }
            .tabItem { Label("Calendar", systemImage: "calendar") }
            .tag(1)

            NavigationStack {
                MessagesPlaceholderView()
            }
            .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }
            .tag(2)

            NavigationStack {
                DiscoverPlaceholderView()
            }
            .tabItem { Label("Discover", systemImage: "sparkles") }
            .tag(3)

            NavigationStack {
                MorePlaceholderView()
            }
            .tabItem { Label("More", systemImage: "ellipsis.circle") }
            .tag(4)
        }
        .tint(Color.cpPrimary)
    }
}

// MARK: - Dashboard (Phase 1 — shows welcome + user info)

struct DashboardView: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Welcome header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back,")
                        .font(.subheadline)
                        .foregroundStyle(Color.cpMuted)
                    Text(auth.currentUser?.displayName ?? auth.currentUser?.username ?? "Parent")
                        .font(.title.bold())
                        .foregroundStyle(Color.cpForeground)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)

                // Quick stats placeholder cards
                HStack(spacing: 12) {
                    statCard(icon: "envelope.fill", title: "Messages", value: "0", color: .cpPrimary)
                    statCard(icon: "calendar", title: "Events", value: "0", color: .cpSuccess)
                    statCard(icon: "dollarsign.circle.fill", title: "Expenses", value: "$0", color: .cpWarning)
                }
                .padding(.horizontal)

                // Placeholder sections
                placeholderSection("Upcoming Events", icon: "calendar.badge.clock")
                placeholderSection("Recent Messages", icon: "bubble.left.fill")
                placeholderSection("Pending Expenses", icon: "creditcard.fill")
            }
            .padding(.vertical)
        }
        .background(Color.cpBackground)
        .navigationTitle("Home")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await auth.signOut() }
                } label: {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .foregroundStyle(Color.cpMuted)
                }
            }
        }
    }

    private func statCard(icon: String, title: String, value: String, color: Color) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(Color.cpForeground)
            Text(title)
                .font(.caption)
                .foregroundStyle(Color.cpMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.04), radius: 8, y: 2)
    }

    private func placeholderSection(_ title: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(Color.cpPrimary)
                Text(title)
                    .font(.headline)
                    .foregroundStyle(Color.cpForeground)
            }
            .padding(.horizontal)

            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .frame(height: 80)
                .overlay(
                    Text("Coming in Phase 2+")
                        .font(.subheadline)
                        .foregroundStyle(Color.cpMuted)
                )
                .padding(.horizontal)
        }
    }
}

// MARK: - Tab Placeholders

struct CalendarPlaceholderView: View {
    var body: some View {
        ContentUnavailableView("Calendar", systemImage: "calendar", description: Text("Coming in Phase 3"))
            .navigationTitle("Calendar")
    }
}

struct MessagesPlaceholderView: View {
    var body: some View {
        ContentUnavailableView("Messages", systemImage: "bubble.left.and.bubble.right", description: Text("Coming in Phase 2"))
            .navigationTitle("Chat")
    }
}

struct DiscoverPlaceholderView: View {
    var body: some View {
        ContentUnavailableView("Discover", systemImage: "sparkles", description: Text("Coming in Phase 5"))
            .navigationTitle("Discover")
    }
}

struct MorePlaceholderView: View {
    var body: some View {
        ContentUnavailableView("More", systemImage: "ellipsis.circle", description: Text("Coming in Phase 5"))
            .navigationTitle("More")
    }
}
