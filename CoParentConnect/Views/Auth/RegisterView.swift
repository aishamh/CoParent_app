import AuthenticationServices
import SwiftUI

struct RegisterView: View {
    @Environment(AuthService.self) private var auth
    @Environment(\.dismiss) private var dismiss

    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var displayName = ""
    @State private var selectedRole = "parent_a"
    @State private var isLoading = false

    private var passwordsMatch: Bool { password == confirmPassword }
    private var isValid: Bool {
        !username.isEmpty && !password.isEmpty && password.count >= 8 && passwordsMatch
    }

    var body: some View {
        ZStack {
            Color.cpBackground.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    headerSection
                    formCard
                    Spacer().frame(height: 20)
                }
                .padding(.horizontal, 32)
            }
        }
        .navigationBarBackButtonHidden(false)
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 16) {
            Spacer().frame(height: 24)

            ZStack {
                Circle()
                    .fill(Color.cpPrimary100)
                    .frame(width: 90, height: 90)

                Image(systemName: "person.badge.plus")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundStyle(Color.cpPrimary)
            }

            VStack(spacing: 6) {
                Text("Create Account")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.cpForeground)

                Text("Join CoParent Connect")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.cpMuted)
            }
        }
    }

    // MARK: - Form Card

    private var formCard: some View {
        VStack(spacing: 16) {
            VStack(spacing: 12) {
                inputField(
                    icon: "person.text.rectangle",
                    placeholder: "Display Name",
                    text: $displayName,
                    contentType: .name
                )

                inputField(
                    icon: "person.fill",
                    placeholder: "Username",
                    text: $username,
                    contentType: .username
                )

                inputField(
                    icon: "envelope.fill",
                    placeholder: "Email (optional)",
                    text: $email,
                    contentType: .emailAddress
                )
                .keyboardType(.emailAddress)

                secureInputField(
                    icon: "lock.fill",
                    placeholder: "Password (min 8 chars)",
                    text: $password
                )

                VStack(spacing: 6) {
                    secureInputField(
                        icon: "lock.rotation",
                        placeholder: "Confirm Password",
                        text: $confirmPassword,
                        hasError: !confirmPassword.isEmpty && !passwordsMatch
                    )

                    if !confirmPassword.isEmpty && !passwordsMatch {
                        HStack(spacing: 4) {
                            Image(systemName: "exclamationmark.circle.fill")
                                .font(.system(size: 11))
                            Text("Passwords don't match")
                                .font(.caption)
                        }
                        .foregroundStyle(Color.cpDestructive)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.leading, 4)
                    }
                }
            }

            roleSelector

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

            submitButton

            HStack(spacing: 12) {
                Rectangle().fill(Color.cpBorder).frame(height: 1)
                Text("or")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.cpMuted.opacity(0.6))
                Rectangle().fill(Color.cpBorder).frame(height: 1)
            }

            SignInWithAppleButton(.signUp) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                _Concurrency.Task {
                    await auth.handleAppleSignIn(result: result)
                }
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 50)
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .padding(20)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.black.opacity(0.06), radius: 12, y: 4)
    }

    private var roleSelector: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your Role")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.cpForeground)

            HStack(spacing: 10) {
                roleButton("Parent A", value: "parent_a", color: .cpParentA)
                roleButton("Parent B", value: "parent_b", color: .cpParentB)
            }
        }
    }

    // MARK: - Submit

    private var submitButton: some View {
        Button {
            isLoading = true
            _Concurrency.Task {
                await auth.signUp(
                    username: username,
                    password: password,
                    email: email.isEmpty ? nil : email,
                    displayName: displayName.isEmpty ? nil : displayName,
                    role: selectedRole
                )
                isLoading = false
            }
        } label: {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView().tint(.white).scaleEffect(0.9)
                } else {
                    Text("Create Account")
                        .font(.system(size: 16, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(
                isValid
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
            .shadow(color: isValid ? Color.cpPrimary.opacity(0.25) : .clear, radius: 6, y: 3)
        }
        .disabled(!isValid || isLoading)
        .padding(.top, 4)
    }

    // MARK: - Input Fields

    @ViewBuilder
    private func inputField(
        icon: String,
        placeholder: String,
        text: Binding<String>,
        contentType: UITextContentType
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.cpMuted)
                .frame(width: 22)

            TextField(placeholder, text: text)
                .textContentType(contentType)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .font(.system(size: 15))
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

    private func secureInputField(
        icon: String,
        placeholder: String,
        text: Binding<String>,
        hasError: Bool = false
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(hasError ? Color.cpDestructive : Color.cpMuted)
                .frame(width: 22)

            SecureField(placeholder, text: text)
                .textContentType(.newPassword)
                .font(.system(size: 15))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 13)
        .background(Color.cpBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(hasError ? Color.cpDestructive : Color.cpBorder, lineWidth: 1.5)
        )
    }

    private func roleButton(_ label: String, value: String, color: Color) -> some View {
        Button {
            selectedRole = value
        } label: {
            HStack(spacing: 6) {
                Image(systemName: selectedRole == value ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 15))
                Text(label)
                    .font(.system(size: 14, weight: .medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(selectedRole == value ? color.opacity(0.1) : Color.cpBackground)
            .foregroundStyle(selectedRole == value ? color : Color.cpMuted)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selectedRole == value ? color : Color.cpBorder, lineWidth: 1.5)
            )
        }
    }
}
