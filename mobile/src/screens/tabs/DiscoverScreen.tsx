import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useTheme } from "../../theme/useTheme";
import { useCreateEvent } from "../../hooks/useEvents";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import Card from "../../components/ui/Card";
import type { ColorPalette } from "../../constants/colors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiscoverActivity {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  description: string;
  priceLevel: number;
  ageRange: string;
  hours: string;
  address: string;
  tags: string[];
  imageColor: string;
}

interface Category {
  key: string;
  label: string;
  icon: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = [
  { key: "cinema", label: "Cinema", icon: "film", color: "#6366F1" },
  { key: "amusement", label: "Amusement Parks", icon: "map", color: "#EC4899" },
  { key: "play", label: "Play Centers", icon: "smile", color: "#F59E0B" },
  { key: "museum", label: "Museums", icon: "book", color: "#8B5CF6" },
  { key: "outdoor", label: "Outdoor", icon: "sun", color: "#22C55E" },
  { key: "sports", label: "Sports", icon: "activity", color: "#3B82F6" },
  { key: "arts", label: "Arts", icon: "edit-3", color: "#F97316" },
  { key: "swimming", label: "Swimming", icon: "droplet", color: "#06B6D4" },
];

const PRICE_LABELS = ["Free", "$", "$$", "$$$", "$$$$"];

const OSLO_ACTIVITIES: DiscoverActivity[] = [
  {
    id: "leo-lekeland",
    name: "Leo's Lekeland",
    category: "play",
    rating: 4.3,
    reviewCount: 1247,
    description:
      "Norway's largest indoor play center with trampolines, climbing walls, ball pits, and slides. Includes a toddler zone and cafe for parents.",
    priceLevel: 2,
    ageRange: "1-12 years",
    hours: "Mon-Fri 10:00-18:00, Sat-Sun 10:00-19:00",
    address: "Snaroyveien 36, 1364 Fornebu",
    tags: ["Indoor", "Trampolines", "Birthday Parties"],
    imageColor: "#F59E0B",
  },
  {
    id: "tusenfryd",
    name: "TusenFryd",
    category: "amusement",
    rating: 4.1,
    reviewCount: 3589,
    description:
      "Norway's premier amusement park with roller coasters, water rides, and family attractions. Home to SpinSpider and the BadeFryd water park.",
    priceLevel: 3,
    ageRange: "All ages",
    hours: "May-Oct, 10:00-20:00 (varies)",
    address: "Vinterbrovegen 25, 1407 Vinterbro",
    tags: ["Roller Coasters", "Water Park", "Seasonal"],
    imageColor: "#EC4899",
  },
  {
    id: "oslo-kino",
    name: "Oslo Kino - Colosseum",
    category: "cinema",
    rating: 4.5,
    reviewCount: 2890,
    description:
      "Oslo's iconic cinema at Colosseum, one of Europe's largest theaters. Regular family matinees, kids' film festivals, and comfortable seating.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Daily 10:00-23:00",
    address: "Fridtjof Nansens vei 6, 0369 Oslo",
    tags: ["Family Movies", "3D", "Candy Bar"],
    imageColor: "#6366F1",
  },
  {
    id: "teknisk-museum",
    name: "Norsk Teknisk Museum",
    category: "museum",
    rating: 4.5,
    reviewCount: 2134,
    description:
      "Norway's national museum of science and technology. Hands-on exhibits, interactive science labs, and the Teknoteket maker space.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Tue-Sun 10:00-18:00 (Wed until 20:00)",
    address: "Kjelsasveien 143, 0491 Oslo",
    tags: ["Science", "Interactive", "Maker Space"],
    imageColor: "#8B5CF6",
  },
  {
    id: "frognerparken",
    name: "Frognerparken & Vigelandsanlegget",
    category: "outdoor",
    rating: 4.7,
    reviewCount: 5672,
    description:
      "Oslo's largest park with over 200 Vigeland sculptures, sprawling lawns, playgrounds, splash pads in summer, and ice skating in winter.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours, Playground 07:00-21:00",
    address: "Nobels gate 32, 0268 Oslo",
    tags: ["Free", "Sculptures", "Playground"],
    imageColor: "#22C55E",
  },
  {
    id: "barnas-kulturhus",
    name: "Barnas Kulturhus",
    category: "arts",
    rating: 4.6,
    reviewCount: 876,
    description:
      "Vibrant cultural center for children with theater performances, art workshops, music classes, and interactive exhibitions.",
    priceLevel: 1,
    ageRange: "2-10 years",
    hours: "Tue-Sun 10:00-16:00",
    address: "Schweigaards gate 14, 0185 Oslo",
    tags: ["Theater", "Art Workshops", "Music"],
    imageColor: "#F97316",
  },
  {
    id: "holmenkollen",
    name: "Holmenkollen Ski Museum & Jump",
    category: "sports",
    rating: 4.4,
    reviewCount: 3102,
    description:
      "The legendary ski jump and world's oldest ski museum. Includes a zipline from the top with panoramic views of the Oslo fjord.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Daily 10:00-17:00 (May-Sep until 20:00)",
    address: "Kongeveien 5, 0787 Oslo",
    tags: ["Ski Jump", "Zipline", "Museum"],
    imageColor: "#3B82F6",
  },
  {
    id: "sorenga-sjobad",
    name: "Sorenga Sjobad",
    category: "swimming",
    rating: 4.2,
    reviewCount: 1034,
    description:
      "Oslo's urban seawater pool complex at the waterfront. Children's pool, diving boards, floating saunas, and stunning fjord views.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Jun-Aug, 07:00-21:00",
    address: "Sorenga 1, 0194 Oslo",
    tags: ["Outdoor Pool", "Diving", "Fjord Views"],
    imageColor: "#06B6D4",
  },
  {
    id: "munch-museum",
    name: "MUNCH Museum",
    category: "museum",
    rating: 4.3,
    reviewCount: 1789,
    description:
      "Striking waterfront museum with Edvard Munch's masterpieces. Family art workshops on weekends, kids' guided tours, and digital experiences.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Tue-Sun 10:00-18:00 (Thu-Sat until 21:00)",
    address: "Edvard Munchs plass 1, 0194 Oslo",
    tags: ["Art", "Kids Workshops", "Architecture"],
    imageColor: "#8B5CF6",
  },
  {
    id: "oslo-vinterpark",
    name: "Oslo Vinterpark (Tryvann)",
    category: "sports",
    rating: 4.0,
    reviewCount: 1456,
    description:
      "Oslo's closest alpine ski resort with slopes for all levels, children's area with magic carpet lifts, and ski school.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Winter: Mon-Fri 10:00-21:00, Sat-Sun 09:30-17:00",
    address: "Tryvannsveien 64, 0791 Oslo",
    tags: ["Skiing", "Kids Slopes", "Ski School"],
    imageColor: "#3B82F6",
  },
  {
    id: "barnekunstmuseet",
    name: "Internasjonalt Barnekunstmuseum",
    category: "arts",
    rating: 4.1,
    reviewCount: 423,
    description:
      "The world's only museum dedicated entirely to art created by children. Rotating exhibits, creative workshops, and a global perspective.",
    priceLevel: 1,
    ageRange: "3-15 years",
    hours: "Tue-Sun 11:00-16:00",
    address: "Lille Frens vei 4, 0369 Oslo",
    tags: ["Children's Art", "Workshops", "Global"],
    imageColor: "#F97316",
  },
  {
    id: "oslo-reptilpark",
    name: "Oslo Reptilpark",
    category: "museum",
    rating: 4.2,
    reviewCount: 987,
    description:
      "Home to over 100 species of reptiles, amphibians, and insects. Interactive feeding sessions and educational talks for children.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Daily 10:00-18:00",
    address: "St. Halvards gate 1, 0192 Oslo",
    tags: ["Animals", "Interactive", "Educational"],
    imageColor: "#8B5CF6",
  },
  {
    id: "oslo-klatrepark",
    name: "Oslo Klatrepark",
    category: "outdoor",
    rating: 4.5,
    reviewCount: 1523,
    description:
      "Treetop adventure park with climbing courses for all ages and skill levels. Zip lines, rope bridges, and Tarzan swings in the forest.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Apr-Oct, 10:00-18:00 (weekends until 19:00)",
    address: "Sognsvannsvn. 75, 0863 Oslo",
    tags: ["Climbing", "Zip Line", "Outdoor"],
    imageColor: "#22C55E",
  },
  {
    id: "bogstad-swimming",
    name: "Bogstad Camping & Bad",
    category: "swimming",
    rating: 4.0,
    reviewCount: 634,
    description:
      "Family-friendly lake swimming with sandy beach, water slide, and canoe rental. Beautiful forest setting near Bogstadvannet lake.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Jun-Aug, 09:00-20:00",
    address: "Ankerveien 117, 0766 Oslo",
    tags: ["Lake", "Beach", "Canoe Rental"],
    imageColor: "#06B6D4",
  },
  {
    id: "deichman-toyen",
    name: "Deichman Toyen (Kids Section)",
    category: "arts",
    rating: 4.6,
    reviewCount: 512,
    description:
      "Award-winning public library with a fantastic children's section. Story time, maker workshops, gaming area, and free activities year-round.",
    priceLevel: 0,
    ageRange: "0-15 years",
    hours: "Mon-Fri 08:00-19:00, Sat 10:00-16:00",
    address: "Hagegata 22, 0653 Oslo",
    tags: ["Free", "Library", "Workshops"],
    imageColor: "#F97316",
  },
  {
    id: "salt-art-music",
    name: "SALT Art & Music",
    category: "outdoor",
    rating: 4.3,
    reviewCount: 892,
    description:
      "Nomadic art village on the Oslo waterfront. Family concerts, art installations, saunas, and seasonal cultural events in a unique setting.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Daily 11:00-23:00 (seasonal)",
    address: "Langkaia 1, 0150 Oslo",
    tags: ["Art", "Music", "Waterfront"],
    imageColor: "#22C55E",
  },
  {
    id: "oslo-filmfestival-kids",
    name: "Oslo Kino - Ringen",
    category: "cinema",
    rating: 4.2,
    reviewCount: 756,
    description:
      "Modern cinema in Grunnerlokka with dedicated kids' screenings, baby-friendly showings, and a cozy family lounge area.",
    priceLevel: 1,
    ageRange: "0+ years",
    hours: "Daily 10:00-22:00",
    address: "Thorvald Meyers gate 82, 0552 Oslo",
    tags: ["Baby Cinema", "Kids Screenings", "Lounge"],
    imageColor: "#6366F1",
  },
];

// ---------------------------------------------------------------------------
// Helper: find category metadata by key
// ---------------------------------------------------------------------------

function findCategoryByKey(key: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.key === key);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HeroHeader({
  colors,
  searchQuery,
  onChangeSearch,
}: {
  colors: ColorPalette;
  searchQuery: string;
  onChangeSearch: (text: string) => void;
}) {
  return (
    <View style={[styles.heroContainer, { backgroundColor: colors.accent }]}>
      <View style={styles.heroTopRow}>
        <View>
          <View
            style={[styles.heroBadge, { backgroundColor: colors.primary }]}
          >
            <Icon name="compass" size={12} color={colors.primaryForeground} />
            <Text
              style={[
                styles.heroBadgeText,
                { color: colors.primaryForeground },
              ]}
            >
              Explore
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Discover Activities
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Family-friendly fun in Oslo
          </Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View
          style={[styles.searchContainer, { backgroundColor: colors.card }]}
        >
          <Icon name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search activities, places..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={onChangeSearch}
            returnKeyType="search"
            accessibilityLabel="Search activities"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onChangeSearch("")}
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.nearMeButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            ReactNativeHapticFeedback.trigger("impactLight");
            Alert.alert("Near Me", "Location-based search coming soon.");
          }}
          accessibilityRole="button"
          accessibilityLabel="Find activities near me"
        >
          <Icon name="navigation" size={16} color={colors.primaryForeground} />
          <Text
            style={[styles.nearMeText, { color: colors.primaryForeground }]}
          >
            Near Me
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  colors,
}: {
  selectedCategory: string | null;
  onSelectCategory: (key: string | null) => void;
  colors: ColorPalette;
}) {
  const handlePress = useCallback(
    (key: string) => {
      ReactNativeHapticFeedback.trigger("selection");
      onSelectCategory(selectedCategory === key ? null : key);
    },
    [selectedCategory, onSelectCategory],
  );

  return (
    <View style={styles.categoryGrid}>
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => handlePress(cat.key)}
            style={styles.categoryTileWrapper}
            accessibilityRole="button"
            accessibilityLabel={cat.label}
            accessibilityState={{ selected: isSelected }}
          >
            <View
              style={[
                styles.categoryIconCircle,
                { backgroundColor: cat.color },
                isSelected && styles.categoryIconCircleSelected,
              ]}
            >
              <Icon name={cat.icon} size={22} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.categoryTileLabel,
                { color: isSelected ? cat.color : colors.foreground },
                isSelected && styles.categoryTileLabelSelected,
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.3;

  return (
    <View style={styles.starRow}>
      {Array.from({ length: fullStars }, (_, i) => (
        <Icon key={`full-${i}`} name="star" size={13} color="#F59E0B" />
      ))}
      {hasHalfStar && <Icon name="star" size={13} color="#FBBF24" />}
      {Array.from(
        { length: 5 - fullStars - (hasHalfStar ? 1 : 0) },
        (_, i) => (
          <Icon key={`empty-${i}`} name="star" size={13} color="#D1D5DB" />
        ),
      )}
    </View>
  );
}

function PriceLevelIndicator({
  level,
  colors,
}: {
  level: number;
  colors: ColorPalette;
}) {
  const label = PRICE_LABELS[level] ?? "$";
  return (
    <View style={styles.metaItem}>
      <Icon name="dollar-sign" size={12} color={colors.mutedForeground} />
      <Text style={[styles.metaText, { color: colors.foreground }]}>
        {label}
      </Text>
    </View>
  );
}

function ActivityCard({
  activity,
  colors,
  onAddToCalendar,
}: {
  activity: DiscoverActivity;
  colors: ColorPalette;
  onAddToCalendar: (activity: DiscoverActivity) => void;
}) {
  const category = findCategoryByKey(activity.category);
  const categoryColor = category?.color ?? colors.primary;

  return (
    <Card
      style={{
        backgroundColor: colors.card,
        marginBottom: 16,
        padding: 0,
        overflow: "hidden" as const,
      }}
    >
      {/* Color header placeholder */}
      <View
        style={[
          styles.cardImagePlaceholder,
          { backgroundColor: activity.imageColor + "25" },
        ]}
      >
        <Icon
          name={category?.icon ?? "map-pin"}
          size={36}
          color={activity.imageColor}
        />
      </View>

      <View style={styles.cardBody}>
        {/* Category badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColor + "20" },
          ]}
        >
          <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
            {category?.label ?? activity.category}
          </Text>
        </View>

        {/* Activity name */}
        <Text
          style={[styles.activityName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {activity.name}
        </Text>

        {/* Rating row */}
        <View style={styles.ratingRow}>
          <StarRating rating={activity.rating} />
          <Text style={[styles.ratingNumber, { color: colors.foreground }]}>
            {activity.rating.toFixed(1)}
          </Text>
          <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
            ({activity.reviewCount.toLocaleString()})
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[styles.activityDescription, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {activity.description}
        </Text>

        {/* Meta row: price, age, hours */}
        <View style={styles.metaRow}>
          <PriceLevelIndicator level={activity.priceLevel} colors={colors} />
          <View style={styles.metaItem}>
            <Icon name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.foreground }]}>
              {activity.ageRange}
            </Text>
          </View>
        </View>

        {/* Hours */}
        <View style={styles.infoRow}>
          <Icon name="clock" size={12} color={colors.mutedForeground} />
          <Text
            style={[styles.infoText, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {activity.hours}
          </Text>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <Icon name="map-pin" size={12} color={colors.mutedForeground} />
          <Text
            style={[styles.infoText, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {activity.address}
          </Text>
        </View>

        {/* Tags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScrollView}
          contentContainerStyle={styles.tagsRow}
        >
          {activity.tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.muted }]}
            >
              <Text
                style={[styles.tagText, { color: colors.mutedForeground }]}
              >
                {tag}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Add to Calendar button */}
        <TouchableOpacity
          onPress={() => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            onAddToCalendar(activity);
          }}
          style={[
            styles.addCalendarButton,
            { backgroundColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${activity.name} to Calendar`}
        >
          <Icon name="calendar" size={15} color={colors.primaryForeground} />
          <Text
            style={[
              styles.addCalendarText,
              { color: colors.primaryForeground },
            ]}
          >
            Add to Calendar
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function EmptyState({ colors }: { colors: ColorPalette }) {
  return (
    <View style={styles.emptyContainer}>
      <Icon name="search" size={40} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No activities found
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Try adjusting your search or clearing the category filter.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const createEvent = useCreateEvent();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useRefreshOnFocus(["events"]);

  const filteredActivities = useMemo(() => {
    return OSLO_ACTIVITIES.filter((activity) => {
      const matchesCategory =
        !selectedCategory || activity.category === selectedCategory;

      const lowerQuery = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !lowerQuery ||
        activity.name.toLowerCase().includes(lowerQuery) ||
        activity.description.toLowerCase().includes(lowerQuery) ||
        activity.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddToCalendar = useCallback(
    (activity: DiscoverActivity) => {
      const today = new Date();
      const dateString = today.toISOString().split("T")[0];

      createEvent.mutate(
        {
          title: activity.name,
          description: activity.description,
          location: activity.name,
          address: activity.address,
          start_date: dateString,
          end_date: dateString,
          start_time: "10:00",
          end_time: "12:00",
          type: "activity",
        } as any,
        {
          onSuccess: () => {
            Alert.alert(
              "Added to Calendar",
              `${activity.name} has been added to your calendar. You can edit the date and time in the Calendar tab.`,
            );
          },
          onError: () => {
            Alert.alert(
              "Could not add",
              "Something went wrong. Please try again.",
            );
          },
        },
      );
    },
    [createEvent],
  );

  const renderActivity = useCallback(
    ({ item }: { item: DiscoverActivity }) => (
      <ActivityCard
        activity={item}
        colors={colors}
        onAddToCalendar={handleAddToCalendar}
      />
    ),
    [colors, handleAddToCalendar],
  );

  const keyExtractor = useCallback(
    (item: DiscoverActivity) => item.id,
    [],
  );

  const listHeader = useMemo(
    () => (
      <>
        {/* Hero with search */}
        <HeroHeader
          colors={colors}
          searchQuery={searchQuery}
          onChangeSearch={setSearchQuery}
        />

        {/* Category grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Browse Categories
          </Text>
          <CategoryGrid
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            colors={colors}
          />
        </View>

        {/* Featured header */}
        <View style={styles.featuredHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Featured Activities
          </Text>
          <Text
            style={[styles.resultCount, { color: colors.mutedForeground }]}
          >
            {filteredActivities.length}{" "}
            {filteredActivities.length === 1 ? "activity" : "activities"} found
          </Text>
        </View>
      </>
    ),
    [colors, searchQuery, selectedCategory, filteredActivities.length],
  );

  const listEmpty = useMemo(
    () => <EmptyState colors={colors} />,
    [colors],
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <FlatList
        data={filteredActivities}
        renderItem={renderActivity}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },

  // Hero
  heroContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  heroTopRow: {
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  nearMeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nearMeText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  featuredHeader: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },

  // Category grid (2x4)
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
    marginBottom: 12,
  },
  categoryTileWrapper: {
    width: "23%",
    alignItems: "center",
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryIconCircleSelected: {
    transform: [{ scale: 1.1 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryTileLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  categoryTileLabelSelected: {
    fontWeight: "700",
  },

  // Stars
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 12,
  },

  // Activity cards
  cardImagePlaceholder: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  activityName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  activityDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },

  // Tags
  tagsScrollView: {
    marginBottom: 14,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Add to Calendar
  addCalendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  addCalendarText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
