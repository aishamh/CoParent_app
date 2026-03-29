import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @Environment(AuthService.self) private var auth
    @State private var username = ""
    @State private var password = ""
    @State private var showRegister = false
    @State private var isLoading = false

    var body: some View {
        ZStack {
            Color.cpBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer().frame(height: 60)

                    // Logo & Title
                    VStack(spacing: 12) {
                        Image(systemName: "figure.2.and.child.holdinghands")
                            .font(.system(size: 56))
                            .foregroundStyle(Color.cpPrimary)

                        Text("CoParent Connect")
                            .font(.largeTitle.bold())
                            .foregroundStyle(Color.cpForeground)

                        Text("Co-parenting made simple")
                            .font(.subheadline)
                            .foregroundStyle(Color.cpMuted)
                    }

                    // Apple Sign In
                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.email, .fullName]
                    } onCompletion: { result in
                        isLoading = true
                        Task {
                            await auth.handleAppleSignIn(result: result)
                            isLoading = false
                        }
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 50)
                    .cornerRadius(12)
                    .padding(.horizontal, 24)

                    // Divider
                    HStack {
                        Rectangle().fill(Color.cpBorder).frame(height: 1)
                        Text("or sign in with email")
                            .font(.caption)
                            .foregroundStyle(Color.cpMuted)
                        Rectangle().fill(Color.cpBorder).frame(height: 1)
                    }
                    .padding(.horizontal, 24)

                    // Email/Password Form
                    VStack(spacing: 16) {
                        TextField("Username", text: $username)
                            .textContentType(.username)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.cpBorder, lineWidth: 1)
                            )

                        SecureField("Password", text: $password)
                            .textContentType(.password)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.cpBorder, lineWidth: 1)
                            )

                        if let error = auth.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(Color.cpDestructive)
                                .multilineTextAlignment(.center)
                        }

                        Button {
                            isLoading = true
                            Task {
                                await auth.signIn(username: username, password: password)
                                isLoading = false
                            }
                        } label: {
                            Group {
                                if isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Sign In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.cpPrimary)
                            .foregroundStyle(.white)
                            .cornerRadius(12)
                        }
                        .disabled(username.isEmpty || password.isEmpty || isLoading)
                        .opacity(username.isEmpty || password.isEmpty ? 0.6 : 1)
                    }
                    .padding(.horizontal, 24)

                    // Register link
                    Button {
                        showRegister = true
                    } label: {
                        HStack(spacing: 4) {
                            Text("Don't have an account?")
                                .foregroundStyle(Color.cpMuted)
                            Text("Sign Up")
                                .fontWeight(.semibold)
                                .foregroundStyle(Color.cpPrimary)
                        }
                        .font(.subheadline)
                    }

                    Spacer()
                }
            }
        }
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }
}
