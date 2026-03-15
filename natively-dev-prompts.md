# CoParent Connect - natively.dev App Generation Prompts

Use these prompts on natively.dev to generate the native iOS app. The app uses Supabase for backend (auth, database, storage).

## Supabase Integration

Connect to the existing Supabase project. The schema is defined in `supabase-schema.sql`. Key tables: families, profiles, children, events, expenses, messages, documents, friends, social_events, reading_list, school_tasks, handover_notes.

---

## Screen 1: Onboarding & Registration

Build a multi-step onboarding flow:
1. Welcome screen with app name "CoParent Connect" and tagline "Stress-free co-parenting coordination"
2. Register with email and password using Supabase Auth
3. Profile setup: display name, role selection (Parent A or Parent B)
4. Add children: name, date of birth, interests, allergies, notes
5. Invite co-parent: enter their email address to send an invite code
6. Success screen showing the family is set up

Use teal (#0d9488) as the primary brand color with warm, calming aesthetics.

## Screen 2: Dashboard (Home)

The main dashboard after login shows:
- Personalized greeting with the user's name and today's date
- "Today's Schedule" card showing events for today from the events table
- Quick stats: number of children, upcoming events count, pending expenses
- Quick action buttons: Add Event, Send Message, Log Expense
- Navigation tabs at the bottom: Home, Calendar, Messages, More

Data comes from Supabase tables: events (filtered by family_id and today's date), children, expenses.

## Screen 3: Calendar

Full-featured family calendar:
- Monthly view with dots on days that have events
- Weekly and day views available via toggle
- Color-coded events: custody (blue), activities (green), medical (red), school (purple), holidays (orange)
- Tap a day to see event list, tap an event to see details
- Add Event button with form: title, type, date/time, child, location, notes, recurrence options
- Edit and delete existing events
- Filter by child or event type

Data: events table filtered by family_id. Supports create, update, delete operations.

## Screen 4: Secure Messages

Court-admissible messaging between co-parents:
- Conversation view showing messages between the two parents in the family
- Each message shows sender, timestamp, and read status
- Messages are immutable once sent (content_hash stored for integrity)
- Compose new message with subject and content
- Unread message badge on the Messages tab
- Security badge explaining messages are tamper-proof

Data: messages table. sender_id and receiver_id are the two parents in the family. Messages include content_hash (SHA-256) for legal integrity.

## Screen 5: Expenses

Shared expense tracking with split calculations:
- List of expenses sorted by date, showing amount, category, who paid, and status
- Filter by status: pending, approved, reimbursed
- Filter by category: medical, education, activities, clothing, food, transport, other
- Add expense form: title, amount, category, date, child, paid by, split percentage, notes, receipt upload
- Each expense shows the calculated split (e.g., "You owe $25.00" or "They owe $25.00")
- Approve/reject pending expenses from co-parent
- Running total of balances

Data: expenses table filtered by family_id.

## Screen 6: Documents

Secure document storage using Supabase Storage:
- Document list grouped by category: medical, legal, school, receipts, court, other
- Upload documents (photos, PDFs) with title, description, category, tags
- Document preview for images and PDFs
- Filter by category and child
- Each document shows upload date, file size, and uploader
- Share documents with co-parent (they see it in their Documents section)

Data: documents table + Supabase Storage bucket "documents".

## Screen 7: Activities & Discover

Activity discovery for families:
- "Discover" tab showing family-friendly events and activities
- Search by location, category, age range
- Categories: outdoor, indoor, educational, sports, arts, nature
- Each activity card shows: image, title, description, location, date, age range, price
- "Add to Calendar" button that creates an event from the activity
- "Curated Activities" section with saved/favorited activities
- Seasonal activity suggestions

Data: activities table for curated content, external events API for discovery.

## Screen 8: Education

Education tracking for children:
- Tabbed view per child
- Reading List: books with title, author, progress bar, assigned parent
- School Tasks: homework and assignments with due dates, status, subject
- Handover Notes: parent-to-parent notes about the child's day, mood, needs
- Add forms for each section
- Progress tracking with visual indicators

Data: reading_list, school_tasks, handover_notes tables filtered by family_id and child_id.

## Screen 9: Social

Friends and social events management:
- Friends list: child's friends with parent contact info, phone, notes
- Add friend form with name, parent name, phone, email
- Social events: playdates, parties, group activities
- RSVP tracking for social events
- Contact details for quick calls/texts to other parents

Data: friends and social_events tables filtered by family_id.

## Screen 10: Settings

User preferences and account management:
- Profile: display name, email, avatar
- Custom parent labels: rename "Parent A"/"Parent B" to custom names (e.g., "Mamma"/"Pappa")
- Notification preferences: new messages, expense approvals, calendar reminders
- Privacy settings: share calendar, share documents, allow messaging
- Theme: light/dark mode toggle
- Family management: view invite code, invite new co-parent
- Sign out

Data: profiles table for user info, local storage for app preferences.

---

## Design System

- **Primary color**: Teal #0d9488 (trust, balance)
- **Secondary**: Warm amber #f59e0b (energy, warmth)
- **Font**: DM Sans (body), Nunito (headings)
- **Style**: Rounded corners (1rem), soft shadows, warm off-white backgrounds
- **Dark mode**: Deep blue-gray backgrounds with teal accents
- **Touch targets**: Minimum 48px for all interactive elements
- **Navigation**: Bottom tab bar with 4 main tabs + "More" for additional screens

## Authentication Flow

- Email/password registration and login via Supabase Auth
- Password reset via email
- Session persistence (stay logged in)
- Protected routes: redirect to login if not authenticated
- Co-parent pairing: Parent A creates family, invites Parent B via email invite code
