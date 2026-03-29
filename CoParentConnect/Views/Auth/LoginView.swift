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
            backgroundGradient

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    heroSection
                    formSection
                    footerSection
                }
            }
        }
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    // MARK: - Hero

    private var heroSection: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 72)

            ZStack {
                Circle()
                    .fill(Color.cpPrimary.opacity(0.08))
                    .frame(width: 120, height: 120)

                Circle()
                    .fill(Color.cpPrimary.opacity(0.15))
                    .frame(width: 88, height: 88)

                Image(systemName: "figure.2.and.child.holdinghands")
                    .font(.system(size: 40, weight: .medium))
                    .foregroundStyle(Color.cpPrimary)
            }

            VStack(spacing: 6) {
                Text("CoParent Connect")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.cpForeground)

                Text("Co-parenting made simple")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Color.cpMuted)
            }
        }
        .padding(.bottom, 40)
    }

    // MARK: - Form

    private var formSection: some View {
        VStack(spacing: 20) {
            VStack(spacing: 14) {
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
                        .font(.caption)
                    Text(error)
                        .font(.caption)
                }
                .foregroundStyle(Color.cpDestructive)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
                .background(Color.cpDestructive.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            signInButton
        }
        .padding(.horizontal, 28)
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
                        .font(.system(size: 17, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(
                canSignIn
                    ? AnyShapeStyle(
                        LinearGradient(
                            colors: [Color.cpPrimary, Color.cpPrimary600],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    : AnyShapeStyle(Color.cpPrimary.opacity(0.35))
            )
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: canSignIn ? Color.cpPrimary.opacity(0.3) : .clear, radius: 8, y: 4)
        }
        .disabled(!canSignIn)
        .padding(.top, 4)
    }

    // MARK: - Footer

    private var footerSection: some View {
        VStack(spacing: 24) {
            dividerRow

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

            Spacer().frame(height: 40)
        }
        .padding(.top, 28)
    }

    private var dividerRow: some View {
        HStack(spacing: 12) {
            capsuleDivider
            Text("or")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.cpMuted.opacity(0.7))
            capsuleDivider
        }
        .padding(.horizontal, 28)
    }

    private var capsuleDivider: some View {
        Rectangle()
            .fill(Color.cpBorder)
            .frame(height: 1)
    }

    // MARK: - Background

    private var backgroundGradient: some View {
        ZStack {
            Color.cpBackground.ignoresSafeArea()

            VStack {
                Ellipse()
                    .fill(Color.cpPrimary.opacity(0.04))
                    .frame(width: 500, height: 300)
                    .offset(y: -100)
                Spacer()
            }
            .ignoresSafeArea()
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
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.cpMuted)
                .frame(width: 20)

            if isSecure {
                SecureField(placeholder, text: text)
                    .textContentType(contentType)
            } else {
                TextField(placeholder, text: text)
                    .textContentType(contentType)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            Color(.systemBackground)
                .shadow(.inner(color: Color.cpBorder.opacity(0.5), radius: 1))
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.cpBorder, lineWidth: 1)
        )
    }
}
