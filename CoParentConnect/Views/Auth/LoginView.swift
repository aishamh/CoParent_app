import AuthenticationServices
import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var auth
    @State private var username = ""
    @State private var password = ""
    @State private var showRegister = false
    @State private var isLoading = false

    private var canSignIn: Bool {
        !username.isEmpty && !password.isEmpty && !isLoading
    }

    var body: some View {
        ZStack {
            Color.cpBackground.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 36) {
                    heroSection
                    formCard
                    footerSection
                }
                .padding(.horizontal, 32)
            }
        }
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    // MARK: - Hero

    private var heroSection: some View {
        VStack(spacing: 20) {
            Spacer().frame(height: 48)

            ZStack {
                Circle()
                    .fill(Color.cpPrimary100)
                    .frame(width: 110, height: 110)

                Image(systemName: "figure.2.and.child.holdinghands")
                    .font(.system(size: 44, weight: .medium))
                    .foregroundStyle(Color.cpPrimary)
            }

            VStack(spacing: 6) {
                Text("CoParent Connect")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.cpForeground)

                Text("Co-parenting made simple")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.cpMuted)
            }
        }
    }

    // MARK: - Form Card

    private var formCard: some View {
        VStack(spacing: 18) {
            VStack(spacing: 12) {
                inputField(
                    icon: "person.fill",
                    placeholder: "Username",
                    text: $username,
                    contentType: .username,
                    isSecure: false
                )

                inputField(
                    icon: "lock.fill",
                    placeholder: "Password",
                    text: $password,
                    contentType: .password,
                    isSecure: true
                )
            }

            if let error = auth.errorMessage {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.system(size: 12))
                    Text(error)
                        .font(.system(size: 13))
                }
                .foregroundStyle(Color.cpDestructive)
                .padding(10)
                .frame(maxWidth: .infinity)
                .background(Color.cpDestructive.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            signInButton
        }
        .padding(20)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.black.opacity(0.06), radius: 12, y: 4)
    }

    private var signInButton: some View {
        Button {
            isLoading = true
            _Concurrency.Task {
                await auth.signIn(username: username, password: password)
                isLoading = false
            }
        } label: {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.9)
                } else {
                    Text("Sign In")
                        .font(.system(size: 16, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                canSignIn
                    ? AnyShapeStyle(
                        LinearGradient(
                            colors: [Color.cpPrimary, Color.cpPrimary600],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    : AnyShapeStyle(Color.cpPrimary.opacity(0.3))
            )
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: canSignIn ? Color.cpPrimary.opacity(0.25) : .clear, radius: 6, y: 3)
        }
        .disabled(!canSignIn)
        .padding(.top, 4)
    }

    // MARK: - Footer

    private var footerSection: some View {
        VStack(spacing: 20) {
            HStack(spacing: 12) {
                Rectangle().fill(Color.cpBorder).frame(height: 1)
                Text("or")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.cpMuted.opacity(0.6))
                Rectangle().fill(Color.cpBorder).frame(height: 1)
            }

            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                _Concurrency.Task {
                    await auth.handleAppleSignIn(result: result)
                }
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 50)
            .clipShape(RoundedRectangle(cornerRadius: 14))

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
                .font(.system(size: 14))
            }

            Spacer().frame(height: 20)
        }
    }

    // MARK: - Input Field

    @ViewBuilder
    private func inputField(
        icon: String,
        placeholder: String,
        text: Binding<String>,
        contentType: UITextContentType,
        isSecure: Bool
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.cpMuted)
                .frame(width: 22)

            if isSecure {
                SecureField(placeholder, text: text)
                    .textContentType(contentType)
                    .font(.system(size: 15))
            } else {
                TextField(placeholder, text: text)
                    .textContentType(contentType)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                    .font(.system(size: 15))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Color.cpBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.cpBorder, lineWidth: 1.5)
        )
    }
}
