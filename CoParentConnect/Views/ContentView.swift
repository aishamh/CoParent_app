import SwiftUI

struct ContentView: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        Group {
            switch auth.state {
            case .loading:
                launchScreen

            case .unauthenticated:
                NavigationStack {
                    LoginView()
                }

            case .needsOnboarding:
                // TODO: Phase 4 — OnboardingFlow
                // For now, go straight to main tabs
                MainTabView()

            case .authenticated:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: auth.state)
        .task {
            await auth.checkExistingAuth()
        }
    }

    private var launchScreen: some View {
        ZStack {
            Color.cpBackground.ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "figure.2.and.child.holdinghands")
                    .font(.system(size: 48))
                    .foregroundStyle(Color.cpPrimary)
                ProgressView()
                    .tint(Color.cpPrimary)
            }
        }
    }
}
