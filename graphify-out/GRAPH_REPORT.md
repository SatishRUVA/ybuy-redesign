# Graph Report - redesign-v1  (2026-11-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2420 nodes · 3505 edges · 219 communities (134 shown, 34 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f05d1035`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 104
- Community 105
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 139
- Community 140
- Community 141
- Community 142
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 153
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 170
- Community 172
- Community 174
- Community 175
- Community 179
- Community 185

## God Nodes (most connected - your core abstractions)
1. `react` - 162 edges
2. `lucide-react` - 111 edges
3. `href()` - 32 edges
4. `rpc()` - 27 edges
5. `money()` - 26 edges
6. `CreateListingPage()` - 23 edges
7. `CreateListingPage()` - 23 edges
8. `rangeLabel()` - 23 edges
9. `usePreview()` - 21 edges
10. `addDays()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `middleware()` --calls--> `verifyAccessSession()`  [EXTRACTED]
  middleware.js → api/_lib/access-session.js
- `localVpnCheck()` --calls--> `isVpnDetectionEnabled()`  [EXTRACTED]
  vite.config.ts → api/_lib/vpn-check.js
- `localVpnCheck()` --calls--> `checkVpn()`  [EXTRACTED]
  vite.config.ts → api/_lib/vpn-check.js
- `pick()` --indirect_call--> `start()`  [INFERRED]
  src/components/listing-availability-picker.tsx → src/lib/feature-flag-store.ts
- `submit()` --indirect_call--> `categoryId()`  [INFERRED]
  src/components/preview-account.tsx → src/components/preview-marketplace.tsx

## Import Cycles
- None detected.

## Communities (219 total, 34 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (53): attempts, auditLog(), config, handler(), json(), tooManyAttempts(), config, handler() (+45 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (11): lucide-react, dateLabel(), DatePicker(), NO_DATES, WEEKDAY_LABELS, Entry, groups, FavoritesPage() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (15): react, CheckoutReservation(), DurationDiscountControl(), HERO_IMAGES, ListingNegotiationSettings(), OwnerBlockedDates(), OwnerPromotionControl(), RentalSettlement() (+7 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (33): mapAppNotification(), mapConversation(), mapMarketplaceNotification(), mapMessage(), PreviewMessages(), PreviewNotifications(), mark(), open() (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (46): AdminBookingRow, AdminCategory, AdminListingRow, AdminPaymentRow, AdminPayoutRow, AdminReviewRow, AdminSetting, AdminUserAccess (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (29): AuctionPage, BiddingDetailPage, BiddingPage, BookingsPage, CheckInPage, CheckoutPage, ClaimDetailPage, ClaimsPage (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (29): addListingImageUrl(), CATEGORY_PHOTOS, CategoryDepositRule, DbCategory, DbListingImage, DbListingOwner, DbListingRow, fetchListingById() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (18): config, handler(), json(), checkVpn(), isVpnDetectionEnabled(), isLocalSupabase(), localProfileLogin(), provision() (+10 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (32): addCaseReply(), approveRefund(), CASE_CATEGORIES, CASE_STATUSES, CaseDetail, CaseEvent, CaseEvidence, CaseKind (+24 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (22): BookingRow(), BookingsPage(), handleTabKeyDown(), selectTab(), formatRange(), OwnerDashboard(), handleMessage(), handleOpenAvailability() (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (25): Messages(), Notifications(), Profile(), Requests(), Admin(), States(), AuctionCard(), Bidding() (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (31): CONDITION_LABELS, CreateListingPage(), addIncludedItem(), analyze(), changed(), continueStep(), discardDraft(), ensureDraft() (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (29): Availability(), CalendarProps, DateField(), DateSummary(), RangeCalendar(), shiftMonth(), startOfMonth(), DemoListingWizard() (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (16): BookingRow(), formatRange(), OwnerDashboard(), handleMessage(), handleOpenAvailability(), handleOpenSelectedAvailability(), reload(), run() (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (28): AuctionListing, auctions, Bid, Booking, cameraComponents, categories, Category, checkInSteps (+20 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (23): AppContent(), CheckInPage, CheckOutPage, ClaimDetailPage, ClaimsPage, ConfirmationPage, GuidelinesPage, isWorkspaceRoute() (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (24): useMarketplace(), Details(), Favorites(), Home(), MarketplaceStatus(), SearchBar(), ListingWizard(), LivePayouts (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (9): AdminItemRequest, createItemRequest(), CreateRequestInput, getValidatedImageExtension(), ItemRequest, ItemRequestStatus, MarketplaceNotification, MarketplaceRequestEvent (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (5): initialSearchPageSize(), MapView(), SearchPage(), initialSearchPageSize(), SearchPage()

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (14): auctionDeadline(), AuctionFilter, auctionStatus(), DemoAuction(), dollars(), isAuctionLive(), LiveBidding(), LiveBiddingDirectory() (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (22): name, private, type, version, autoprefixer, country-region-data, eslint, @eslint/js (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (18): label(), ListingAvailabilityPicker(), pick(), NO_DATES, ConnectionStatus, createFeatureFlagStore(), start(), FeatureFlag (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (15): auctionDeadline(), AuctionFilter, auctionStatus(), BiddingPage(), DemoAuction(), dollars(), isAuctionLive(), LiveBidding() (+7 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (21): DemoNotificationCenter(), groups, icons, inboxCategories, noticeDay(), NotificationCenter(), NotificationCenterRow, NotificationsBackend (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (15): @radix-ui/react-dialog, Dialog, DialogContent, DialogDescription, DialogOverlay, DialogTitle, DialogTrigger, SheetContent (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (17): react-dom, Alert(), Badge(), BADGE_TONE, BadgeTone, Button(), BUTTON_SIZE, BUTTON_VARIANT (+9 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (15): checkoutAmountCents(), moneyToCents(), quoteSandboxCheckout(), SandboxCheckoutQuote, SandboxPricingPolicy, ServerBookingPrice, sumCents(), ProtectionProvider (+7 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (20): BackendRequests(), DemoRequests(), Browse(), DiscoveryMap(), ItemDetails(), DemoOwner(), DemoPayouts(), LiveOwnerView() (+12 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (16): DateRangePicker(), handlePick(), handlePreset(), openPicker(), daysBetweenIso(), fmtRangeShort(), fmtRangeTiny(), formatIsoLocal() (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (16): DateRangePicker(), handlePick(), handlePreset(), openPicker(), daysBetweenIso(), fmtRangeShort(), fmtRangeTiny(), formatIsoLocal() (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (19): CreateListingPage(), addIncludedItem(), analyze(), changed(), continueStep(), discardDraft(), ensureDraft(), mutatePhotos() (+11 more)

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (20): devDependencies, autoprefixer, country-region-data, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+12 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (15): accessRequest(), AdminPage, AdminPortal(), lock(), verify(), Grant, Role, roleName() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (16): AuctionBid, AuctionFeed, AuctionFeedItem, auctionResult(), EMPTY_AUCTION_PREFERENCES, getListingAuction(), getListingAuctionFeed(), getTopListingBids() (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (16): Category, dateLabel(), money(), MyRequestCard(), MyRequestDetails(), NeedSomethingPage(), submit(), REQUEST_STATUS_LABEL (+8 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (9): INTEGRATIONS, stripe, stripe, stripe, requireTestSettlement(), allowedOrigins(), corsHeaders(), trustedOrigin() (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (16): addDaysIso(), cityForCoordinates(), cityFromFeature(), estimateCityFromIp(), findCities(), geocode(), haversineMiles(), LocationSource (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (9): AppNotification, markConversationMessagesRead(), markNotificationRead(), NOTIFICATION_CATEGORIES, NotificationCategory, NotificationChannel, NotificationPreferenceKey, NotificationPreferences (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (14): fieldClass(), RequestFulfillment(), link(), Surface(), CONDITION_LABELS, EMPTY_FORM, EMPTY_PICKUP, FlowErrors (+6 more)

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (16): acknowledgeBookingInspection(), beginBookingReturnInspection(), BookingHandoff, getBookingHandoffOtp(), HandoffInspection, HandoffInspectionDetail, HandoffKind, HandoffPhoto (+8 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (5): formatRequestDates(), HomePage(), STEPS, RequestsPage(), fetchNearbyRequests()

### Community 42 - "Community 42"
Cohesion: 0.11
Nodes (13): BackendProfile(), DemoMessages(), DemoProfile(), MessagesBackend, PreviewConversation, PreviewConversationMessage, PreviewNotice, PreviewOwnerListing (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (14): Context, MarketplaceStore, LiveOwner, PageName, DEFAULT_SEARCH, PContext, PCtx, PRoute (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.12
Nodes (7): BADGE_TONE, BadgeTone, BUTTON_SIZE, BUTTON_VARIANT, ButtonProps, ButtonSize, ButtonVariant

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (15): BookingPickup, BookingStatus, callBookingRpc(), cancelBooking(), createBookingRequest(), DbBookingListing, DbBookingProfile, DbBookingRow (+7 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.13
Nodes (11): @radix-ui/react-alert-dialog, AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialog, AlertDialogCancel (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (10): failure(), MembersContent(), saveRestriction(), ModerationContent(), approve(), loadReview(), normalizedSection(), PreviewAdmin() (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (12): Confidence, Flag, FlagType, json(), PhotoQualitySuggestion, PROHIBITED_ITEMS, RawAIFlag, RawAIResult (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.21
Nodes (9): AuthEmailEvent, renderTestAuthEmails(), TEST_APP, TEST_BACKEND, TEST_INBOX, escapeHtml(), NotificationEmail, renderNotificationEmail() (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.20
Nodes (8): configurePodmanLogs(), podman, userInstall, machines, result, remaining, rows, updates

### Community 52 - "Community 52"
Cohesion: 0.14
Nodes (14): dependencies, clsx, gsap, lucide-react, motion, @radix-ui/react-alert-dialog, @radix-ui/react-dialog, @radix-ui/react-select (+6 more)

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (11): @radix-ui/react-select, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Select, SelectContent (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.16
Nodes (8): AuthContext, AuthContextValue, AuthProvider(), clearLocalSession(), onVisible(), selectLocalProfile(), verifySession(), Profile

### Community 55 - "Community 55"
Cohesion: 0.19
Nodes (12): DbConversationListing, DbConversationRow, DbProfileLite, fetchConversations(), fetchMessages(), MESSAGE_MAX_LENGTH, sendMessage(), subscribeToMessages() (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.23
Nodes (11): BookingHandoff(), handleAcknowledge(), handleDepositClaim(), handleIssue(), handleOtpVerify(), handleSaveInspection(), perform(), dateLabel() (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.27
Nodes (9): auctionDeadline(), auctionStatus(), errorMessage(), PreviewBidding(), load(), loadOwnerAuctions(), PreviewBidRoom(), submit() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.17
Nodes (5): PLACEHOLDER_EXAMPLES, SearchBar(), SearchParams, ThemeSwitcher(), handler()

### Community 59 - "Community 59"
Cohesion: 0.26
Nodes (6): ConnectedOwner(), refresh(), run(), ConnectedPayouts(), fetchOwnerInventory(), message()

### Community 60 - "Community 60"
Cohesion: 0.18
Nodes (4): SearchBar(), SearchParams, ThemeSwitcher(), handler()

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (10): ITEM_STEP_FIELDS, LISTING_FIELD_IDS, LISTING_RULES, ListingField, ListingFormValues, moneyError(), parseMoney(), TERMS_STEP_FIELDS (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.24
Nodes (9): browserCityOrCoordinates(), LocationContext, LocationContextValue, LocationProvider(), requestBrowserLocation(), resolveInitialLocation(), selectCity(), savedLocation() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.23
Nodes (5): MarketplaceUpdates(), NotificationsPage(), loadMore(), markAllRead(), relativeTime()

### Community 65 - "Community 65"
Cohesion: 0.23
Nodes (5): MarketplaceUpdates(), NotificationsPage(), loadMore(), markAllRead(), relativeTime()

### Community 66 - "Community 66"
Cohesion: 0.23
Nodes (10): connectRequest(), json(), processBooking(), settleDepositAuthorization(), cents(), Intent, Refund, sameWorkerSecret() (+2 more)

### Community 67 - "Community 67"
Cohesion: 0.20
Nodes (5): asPercent(), blankCategory, CategoriesSection(), CategoryDraft, SettingsSection()

### Community 68 - "Community 68"
Cohesion: 0.18
Nodes (6): AdminDraft, AdminsSection(), ENTITY_TYPES, GRANTABLE, PERMISSION_LABELS, PRESETS

### Community 69 - "Community 69"
Cohesion: 0.25
Nodes (6): BOOKING_STATUSES, BookingsSection(), filterArg(), ListingsSection(), PaymentsSection(), PayoutsSection()

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (5): asPercent(), blankCategory, CategoriesSection(), CategoryDraft, SettingsSection()

### Community 71 - "Community 71"
Cohesion: 0.18
Nodes (6): AdminDraft, AdminsSection(), ENTITY_TYPES, GRANTABLE, PERMISSION_LABELS, PRESETS

### Community 72 - "Community 72"
Cohesion: 0.25
Nodes (6): BOOKING_STATUSES, BookingsSection(), filterArg(), ListingsSection(), PaymentsSection(), PayoutsSection()

### Community 73 - "Community 73"
Cohesion: 0.18
Nodes (3): Column, ReasonDialog(), STATUS_TONE

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (3): Column, ReasonDialog(), STATUS_TONE

### Community 76 - "Community 76"
Cohesion: 0.27
Nodes (6): formatDateShort(), formatMoney(), ListingPage(), PriceRow(), tomorrowIso(), fetchMainItemRequest()

### Community 77 - "Community 77"
Cohesion: 0.31
Nodes (9): notificationRoute(), pathToRoute(), replaceLegacyDashboardPath(), Route, RouterContext, RouterContextValue, RouterProvider(), onPopState() (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.22
Nodes (4): Enrollment, VaultChest(), lock(), save()

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (4): Enrollment, VaultChest(), lock(), save()

### Community 81 - "Community 81"
Cohesion: 0.29
Nodes (7): BiddingTicker(), createDemoOffers(), dateAfter(), DEMO_BADGES, formatDate(), timeToBid(), TopBid

### Community 82 - "Community 82"
Cohesion: 0.33
Nodes (6): fmtDate(), money(), PAGE_SIZE, PagedQuery, useLoad(), WalletPanel()

### Community 83 - "Community 83"
Cohesion: 0.29
Nodes (8): BookingPickupSlot, BookingPrecheckin, fetchBookingPrecheckin(), HandoffKind, isPrecheckin(), isRecord(), isTimestamp(), respondToBookingHandoffSlot()

### Community 84 - "Community 84"
Cohesion: 0.24
Nodes (7): ListingFlowDetails, ListingFlowPolicy, ListingFlowResult, ListingFlowStatus, result(), saveAuctionPreferences(), saveListingFlow()

### Community 85 - "Community 85"
Cohesion: 0.24
Nodes (6): BankPayoutStatus, DbPayoutRow, invokeSettlement(), processRentalSettlement(), RentalSettlement, startConnectOnboarding()

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (7): BiddingTicker(), createDemoOffers(), dateAfter(), DEMO_BADGES, formatDate(), timeToBid(), TopBid

### Community 88 - "Community 88"
Cohesion: 0.24
Nodes (3): handleListingLinkClick(), ListingCard(), ListingCardWide()

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (6): fmtDate(), money(), PAGE_SIZE, PagedQuery, useLoad(), WalletPanel()

### Community 90 - "Community 90"
Cohesion: 0.29
Nodes (5): formatDateShort(), formatMoney(), ListingPage(), PriceRow(), tomorrowIso()

### Community 91 - "Community 91"
Cohesion: 0.28
Nodes (7): AdminPage(), ALL_ITEMS, can(), GROUPS, Icon, Nav(), NavItem

### Community 92 - "Community 92"
Cohesion: 0.44
Nodes (8): label(), ListingAuctionPreferences(), pick(), localInputValue(), NO_DATES, parseDate(), toIso(), twoHoursBeforePickup()

### Community 94 - "Community 94"
Cohesion: 0.25
Nodes (6): DbReviewRow, fetchOwnerRatings(), fetchReviewsForUser(), OwnerRatingStats, OwnerReviewsResult, REVIEW_MAX_LENGTH

### Community 95 - "Community 95"
Cohesion: 0.31
Nodes (8): parseSearchRadius(), readSearchState(), savedSearchState(), saveSearchState(), SEARCH_RADII, SearchRadius, SearchState, searchStateParams()

### Community 96 - "Community 96"
Cohesion: 0.31
Nodes (7): assertPlainText(), assertUuid(), InputValidationError, PICKUP_TEXT_MAX, plainTextError(), UNSAFE_TEXT, UUID_RE

### Community 97 - "Community 97"
Cohesion: 0.44
Nodes (8): label(), ListingAuctionPreferences(), pick(), localInputValue(), NO_DATES, parseDate(), toIso(), twoHoursBeforePickup()

### Community 98 - "Community 98"
Cohesion: 0.36
Nodes (6): CheckoutPage(), ConfirmationPage(), formatDay(), formatMoney(), NEXT_STEP, Row()

### Community 99 - "Community 99"
Cohesion: 0.31
Nodes (6): CheckoutPage(), ConfirmationPage(), formatDay(), formatMoney(), NEXT_STEP, Row()

### Community 100 - "Community 100"
Cohesion: 0.25
Nodes (6): categoryNames, cities, data, result, templates, typescript

### Community 101 - "Community 101"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dev:local, lint, preview, supabase:local, typecheck

### Community 102 - "Community 102"
Cohesion: 0.29
Nodes (4): Action, formatDate(), SuccessFeedback(), SuccessFeedbackProps

### Community 104 - "Community 104"
Cohesion: 0.29
Nodes (7): ADMIN_PERMISSIONS, AdminAccess, AdminAccessState, AdminPermission, isAdminAccess(), useAdminAccess(), fetchAccess()

### Community 105 - "Community 105"
Cohesion: 0.29
Nodes (4): Action, formatDate(), SuccessFeedback(), SuccessFeedbackProps

### Community 107 - "Community 107"
Cohesion: 0.33
Nodes (5): AddressComponent, getComponent(), PickupLocation(), PlacePredictionSelectEvent, SelectedPlace

### Community 108 - "Community 108"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 109 - "Community 109"
Cohesion: 0.33
Nodes (6): account, Entry, isActive(), lending, renting, WorkspaceSidebar()

### Community 110 - "Community 110"
Cohesion: 0.29
Nodes (5): EMPTY_ITEM_DETAILS, HANDOFF_WINDOWS, HandoffWindow, ListingItemDetails, RETURN_RULE_OPTIONS

### Community 111 - "Community 111"
Cohesion: 0.29
Nodes (5): HOSTED_PROFILE_LOGIN, LOCAL_PROFILE_LOGIN, LocalLoginProfile, PROFILE_ENDPOINT, PROFILE_LOGIN

### Community 113 - "Community 113"
Cohesion: 0.33
Nodes (5): calculateRentalPricing(), cents(), RentalPackageKind, RentalPricing, RentalPricingOptions

### Community 114 - "Community 114"
Cohesion: 0.33
Nodes (4): BookingPrecheckin(), dateLabel(), NOTE_SUGGESTIONS, SLOT_LABELS

### Community 115 - "Community 115"
Cohesion: 0.43
Nodes (5): deadlineLabel(), errorMessage(), ListingAuctionPanel(), submit(), NO_DATES

### Community 116 - "Community 116"
Cohesion: 0.33
Nodes (5): AddressComponent, getComponent(), PickupLocation(), PlacePredictionSelectEvent, SelectedPlace

### Community 117 - "Community 117"
Cohesion: 0.29
Nodes (6): Table, TableBody, TableCell, TableHead, TableHeader, TableRow

### Community 118 - "Community 118"
Cohesion: 0.29
Nodes (5): baseVars, defaultTheme, Theme, ThemeId, themes

### Community 119 - "Community 119"
Cohesion: 0.33
Nodes (5): stripe, supabaseAdmin, RefundEvent, RefundReceipt, testRefundReceipt()

### Community 120 - "Community 120"
Cohesion: 0.47
Nodes (3): pageName(), ProductionPreviewHeader(), ProductionPreviewSidebar()

### Community 121 - "Community 121"
Cohesion: 0.33
Nodes (5): Card, CardContent, CardDescription, CardHeader, CardTitle

### Community 122 - "Community 122"
Cohesion: 0.33
Nodes (4): AUTH_PROVIDER_LABELS, AuthProviderId, ENABLED_AUTH_PROVIDERS, KNOWN

### Community 123 - "Community 123"
Cohesion: 0.33
Nodes (3): LISTING_MAX_AVAILABLE_DAYS, LISTING_SCHEDULING_DAYS, RENTAL_MAX_DAYS

### Community 125 - "Community 125"
Cohesion: 0.33
Nodes (5): Card, CardContent, CardDescription, CardHeader, CardTitle

### Community 126 - "Community 126"
Cohesion: 0.47
Nodes (3): ChatView(), MessagingPage(), timeAgo()

### Community 127 - "Community 127"
Cohesion: 0.47
Nodes (3): ChatView(), MessagingPage(), timeAgo()

### Community 128 - "Community 128"
Cohesion: 0.33
Nodes (3): anonKey, serviceRoleKey, supabaseUrl

### Community 129 - "Community 129"
Cohesion: 0.40
Nodes (4): contents, result, status, url

### Community 130 - "Community 130"
Cohesion: 0.40
Nodes (3): @radix-ui/react-switch, Switch, Switch

### Community 135 - "Community 135"
Cohesion: 0.50
Nodes (4): CategoryIcon(), ICON_EXPORTS, NAMED_ICONS, normalize()

### Community 136 - "Community 136"
Cohesion: 0.70
Nodes (4): deadlineLabel(), errorMessage(), ListingAuctionPanel(), submit()

### Community 144 - "Community 144"
Cohesion: 0.40
Nodes (4): OUT_OF_SCOPE_ROUTES, SHOW_DEMO_THEMES, SHOW_HERO_CATEGORY_PILLS, SHOW_OUT_OF_SCOPE_PAGES

### Community 145 - "Community 145"
Cohesion: 0.40
Nodes (3): GoogleMapsRuntime, GooglePlacesLibrary, Window

### Community 147 - "Community 147"
Cohesion: 0.60
Nodes (4): countryIsAllowed(), fetchMarketplaceCountries(), MarketplaceCountry, requireMarketplaceCountry()

### Community 156 - "Community 156"
Cohesion: 0.70
Nodes (4): Invoke-LocalSql(), Invoke-Race(), Start-LocalSession(), Wait-LocalSession()

### Community 157 - "Community 157"
Cohesion: 0.40
Nodes (4): buildCommand, framework, outputDirectory, rewrites

### Community 164 - "Community 164"
Cohesion: 0.67
Nodes (3): store, useFeatureFlag(), useFeatureFlags()

### Community 165 - "Community 165"
Cohesion: 0.67
Nodes (3): CategoryIcon(), NAMED_ICONS, normalize()

### Community 166 - "Community 166"
Cohesion: 0.67
Nodes (3): dateLabel(), DatePicker(), NO_DATES

### Community 167 - "Community 167"
Cohesion: 0.67
Nodes (3): AccessPage(), handleSubmit(), getRedirectTarget()

### Community 168 - "Community 168"
Cohesion: 0.83
Nodes (3): AccessPage(), handleSubmit(), getRedirectTarget()

## Knowledge Gaps
- **670 isolated node(s):** `ADMIN_HOST`, `TEST_BACKEND`, `ADMIN_COOKIE`, `config`, `attempts` (+665 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1332 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 2` to `Community 1`, `Community 3`, `Community 5`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 34`, `Community 39`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 47`, `Community 48`, `Community 53`, `Community 54`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 62`, `Community 64`, `Community 65`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 75`, `Community 76`, `Community 77`, `Community 79`, `Community 80`, `Community 81`, `Community 82`, `Community 87`, `Community 88`, `Community 89`, `Community 90`, `Community 92`, `Community 93`, `Community 97`, `Community 98`, `Community 99`, `Community 102`, `Community 103`, `Community 104`, `Community 105`, `Community 106`, `Community 107`, `Community 108`, `Community 114`, `Community 115`, `Community 116`, `Community 117`, `Community 120`, `Community 121`, `Community 125`, `Community 126`, `Community 127`, `Community 130`, `Community 131`, `Community 132`, `Community 133`, `Community 134`, `Community 136`, `Community 137`, `Community 138`, `Community 139`, `Community 140`, `Community 149`, `Community 150`, `Community 151`, `Community 152`, `Community 153`, `Community 154`, `Community 155`, `Community 160`, `Community 161`, `Community 164`, `Community 166`, `Community 167`, `Community 168`, `Community 170`, `Community 175`?**
  _High betweenness centrality (0.293) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Community 1` to `Community 3`, `Community 5`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 34`, `Community 39`, `Community 41`, `Community 42`, `Community 44`, `Community 48`, `Community 53`, `Community 56`, `Community 57`, `Community 58`, `Community 60`, `Community 64`, `Community 65`, `Community 67`, `Community 68`, `Community 70`, `Community 71`, `Community 73`, `Community 75`, `Community 76`, `Community 79`, `Community 80`, `Community 81`, `Community 87`, `Community 88`, `Community 90`, `Community 91`, `Community 92`, `Community 93`, `Community 97`, `Community 98`, `Community 99`, `Community 102`, `Community 103`, `Community 105`, `Community 106`, `Community 107`, `Community 109`, `Community 115`, `Community 116`, `Community 126`, `Community 127`, `Community 135`, `Community 136`, `Community 137`, `Community 140`, `Community 151`, `Community 152`, `Community 153`, `Community 154`, `Community 160`, `Community 161`, `Community 165`, `Community 166`, `Community 167`, `Community 168`, `Community 170`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `Community 0` to `Community 20`, `Community 54`, `Community 7`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `ADMIN_HOST`, `TEST_BACKEND`, `ADMIN_COOKIE` to the rest of the system?**
  _670 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06057692307692308 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._