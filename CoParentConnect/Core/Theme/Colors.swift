import SwiftUI

extension Color {
    // MARK: - Brand

    /// Logo navy blue #2B5EA7
    static let cpPrimary = Color(red: 0.169, green: 0.369, blue: 0.655)
    /// Darker blue for emphasis #1E4A8A
    static let cpPrimary600 = Color(red: 0.118, green: 0.290, blue: 0.541)
    /// Ice blue subtle background #E8F0FA
    static let cpPrimary100 = Color(red: 0.910, green: 0.941, blue: 0.980)

    // MARK: - Background

    /// Warm off-white base #FAF8F5
    static let cpBackground = Color(red: 0.980, green: 0.973, blue: 0.961)
    /// Deep navy-charcoal #1A2438
    static let cpForeground = Color(red: 0.102, green: 0.141, blue: 0.220)

    // MARK: - Semantic

    static let cpSuccess = Color(red: 0.180, green: 0.604, blue: 0.416)
    static let cpWarning = Color(red: 0.961, green: 0.651, blue: 0.137)
    static let cpDestructive = Color(red: 0.863, green: 0.208, blue: 0.271)

    // MARK: - Neutral

    /// Slate with blue tint #6B7590
    static let cpMuted = Color(red: 0.420, green: 0.459, blue: 0.565)
    /// Border/input #E2E5EB
    static let cpBorder = Color(red: 0.886, green: 0.898, blue: 0.922)

    // MARK: - Parent Identity

    /// Lighter blue for Parent A #4A8FD4
    static let cpParentA = Color(red: 0.290, green: 0.561, blue: 0.831)
    /// Warm terracotta-orange for Parent B #E8925A
    static let cpParentB = Color(red: 0.910, green: 0.573, blue: 0.353)

    // MARK: - Event Types

    static let cpEventCustody = cpPrimary
    static let cpEventHoliday = cpWarning
    static let cpEventActivity = cpSuccess
    static let cpEventMedical = cpDestructive
    static let cpEventSchool = Color(red: 0.486, green: 0.361, blue: 0.749)
}
