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
            backgroundGradient

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    headerSection
                    formFields
                    errorSection
                    submitButton
                    Spacer().frame(height: 40)
                }
            }
        }
        .navigationBarBackButtonHidden(false)
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(Color.cpPrimary.opacity(0.08))
                    .frame(width: 80, height: 80)

                Image(systemName: "person.badge.plus")
                    .font(.system(size: 32, weight: .medium))
                    .foregroundStyle(Color.cpPrimary)
            }

            Text("Create Account")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundStyle(Color.cpForeground)

            Text("Join CoParent Connect")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.cpMuted)
        }
        .padding(.top, 20)
    }

    // MARK: - Form

    private var formFields: some View {
        VStack(spacing: 14) {
            inputField(icon: "person.text.rectangle", placeholder: "Display Name", text: $displayName, contentType: .name)
            inputField(icon: "person.fill", placeholder: "Username", text: $username, contentType: .username)
            inputField(icon: "envelope.fill", placeholder: "Email (optional)", text: $email, contentType: .emailAddress)
                .keyboardType(.emailAddress)

            secureInputField(icon: "lock.fill", placeholder: "Password (min 8 characters)", text: $password)

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

            roleSelector
        }
        .padding(.horizontal, 28)
    }

    private var roleSelector: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your Role")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color.cpForeground)

            HStack(spacing: 12) {
                roleButton("Parent A", value: "parent_a", color: .cpParentA)
                roleButton("Parent B", value: "parent_b", color: .cpParentB)
            }
        }
        .padding(.top, 4)
    }

    // MARK: - Error

    @ViewBuilder
    private var errorSection: some View {
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
            .padding(.horizontal, 28)
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
                        .font(.system(size: 17, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(
                isValid
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
            .shadow(color: isValid ? Color.cpPrimary.opacity(0.3) : .clear, radius: 8, y: 4)
        }
        .disabled(!isValid || isLoading)
        .padding(.horizontal, 28)
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

    // MARK: - Components

    private func inputField(icon: String, placeholder: String, text: Binding<String>, contentType: UITextContentType) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Color.cpMuted)
                .frame(width: 20)

            TextField(placeholder, text: text)
                .textContentType(contentType)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.cpBorder, lineWidth: 1)
        )
    }

    private func secureInputField(icon: String, placeholder: String, text: Binding<String>, hasError: Bool = false) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(hasError ? Color.cpDestructive : Color.cpMuted)
                .frame(width: 20)

            SecureField(placeholder, text: text)
                .textContentType(.newPassword)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(hasError ? Color.cpDestructive : Color.cpBorder, lineWidth: 1)
        )
    }

    private func roleButton(_ label: String, value: String, color: Color) -> some View {
        Button {
            selectedRole = value
        } label: {
            HStack(spacing: 6) {
                Image(systemName: selectedRole == value ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 16))
                Text(label)
                    .font(.system(size: 14, weight: .medium))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(selectedRole == value ? color.opacity(0.1) : Color(.systemBackground))
            .foregroundStyle(selectedRole == value ? color : Color.cpMuted)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selectedRole == value ? color : Color.cpBorder, lineWidth: 1.5)
            )
        }
    }
}
