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

            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Text("Create Account")
                            .font(.title.bold())
                            .foregroundStyle(Color.cpForeground)

                        Text("Join CoParent Connect")
                            .font(.subheadline)
                            .foregroundStyle(Color.cpMuted)
                    }
                    .padding(.top, 20)

                    // Form fields
                    VStack(spacing: 16) {
                        formField("Display Name", text: $displayName, contentType: .name)
                        formField("Username", text: $username, contentType: .username)
                        formField("Email (optional)", text: $email, contentType: .emailAddress)
                            .keyboardType(.emailAddress)

                        SecureField("Password (min 8 characters)", text: $password)
                            .textContentType(.newPassword)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.cpBorder, lineWidth: 1)
                            )

                        SecureField("Confirm Password", text: $confirmPassword)
                            .textContentType(.newPassword)
                            .padding()
                            .background(Color(.systemBackground))
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(
                                        !confirmPassword.isEmpty && !passwordsMatch
                                            ? Color.cpDestructive : Color.cpBorder,
                                        lineWidth: 1
                                    )
                            )

                        if !confirmPassword.isEmpty && !passwordsMatch {
                            Text("Passwords don't match")
                                .font(.caption)
                                .foregroundStyle(Color.cpDestructive)
                        }

                        // Role selector
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Your Role")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(Color.cpForeground)

                            HStack(spacing: 12) {
                                roleButton("Parent A", value: "parent_a", color: .cpParentA)
                                roleButton("Parent B", value: "parent_b", color: .cpParentB)
                            }
                        }
                    }
                    .padding(.horizontal, 24)

                    // Error
                    if let error = auth.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(Color.cpDestructive)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                    }

                    // Submit
                    Button {
                        isLoading = true
                        Task {
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
                        Group {
                            if isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Create Account")
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(isValid ? Color.cpPrimary : Color.cpPrimary.opacity(0.4))
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!isValid || isLoading)
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
        }
        .navigationBarBackButtonHidden(false)
    }

    // MARK: - Components

    private func formField(_ placeholder: String, text: Binding<String>, contentType: UITextContentType) -> some View {
        TextField(placeholder, text: text)
            .textContentType(contentType)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.cpBorder, lineWidth: 1)
            )
    }

    private func roleButton(_ label: String, value: String, color: Color) -> some View {
        Button {
            selectedRole = value
        } label: {
            Text(label)
                .font(.subheadline.weight(.medium))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(selectedRole == value ? color.opacity(0.15) : Color(.systemBackground))
                .foregroundStyle(selectedRole == value ? color : Color.cpMuted)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(selectedRole == value ? color : Color.cpBorder, lineWidth: 1.5)
                )
        }
    }
}
