import SwiftUI
import SwiftData

@main
struct CoParentConnectApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var authService = AuthService.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authService)
        }
        .modelContainer(for: [
            CPUser.self,
        ])
    }
}
