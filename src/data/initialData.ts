import { 
  Product, 
  AppSettings, 
  PaymentMethodConfig,
  CollectionItem, 
  FanProject, 
  TeamKAALLibraryItem,
  Order,
  Customer,
  AdminUser,
  PaymentRecord,
  EmailLog
} from '../types';

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-gcash',
    name: 'GCash',
    accountName: 'Mae Joey Balla',
    accountNumber: '09203963249',
    qrCodeUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    instructions: 'Send exact amount via GCash Express Send or scan QR code. Save and upload your transaction receipt.',
    active: true,
    sortOrder: 1
  },
  {
    id: 'pm-maya',
    name: 'Maya',
    accountName: 'Mae Joey Balla',
    accountNumber: '09203963249',
    qrCodeUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=600&q=80',
    instructions: 'Send via Maya / PayMaya to the designated mobile number or scan the QR code. Keep screenshot.',
    active: true,
    sortOrder: 2
  },
  {
    id: 'pm-maribank',
    name: 'MariBank',
    accountName: 'Mae Joey Balla',
    accountNumber: '09203963249',
    qrCodeUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=600&q=80',
    instructions: 'Send via SeaBank / MariBank or InstaPay transfer. Save transfer receipt.',
    active: true,
    sortOrder: 3
  },
  {
    id: 'pm-bank',
    name: 'Bank Transfer (BDO / BPI / UnionBank)',
    accountName: 'Mae Joey Balla',
    accountNumber: '1092-8374-2910',
    qrCodeUrl: '',
    instructions: 'Transfer via InstaPay / PESONet to designated account. Keep reference number & receipt screenshot.',
    active: true,
    sortOrder: 4
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  sheetName: 'APMERCH_DATABASE',
  appsScriptUrl: import.meta.env.VITE_APPS_SCRIPT_URL || '',
  paymentMethods: INITIAL_PAYMENT_METHODS,
  gcashNumber: '09203963249',
  gcashAccountName: 'Mae Joey Balla',
  gcashQrUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80',
  maribankNumber: '09203963249',
  maribankAccountName: 'Mae Joey Balla',
  maribankQrUrl: '',
  preorderOpenDate: '2026-09-01T00:00:00+08:00',
  preorderCloseDate: '2026-09-20T23:59:59+08:00',
  preorderWindowText: 'Sept 1 – Sept 20, 2026',
  preorderStatusManual: 'auto',
  preorderOpenDescription: "Lock in your exclusive A'TIN Panay x Team KAAL BlockScreening merchandise before slots close on September 20, 2026 at 11:59 PM PHT.",
  preorderClosedDescription: 'All slots for this production batch are officially sealed. Orders are now in queue for production and October 11, 2026 claiming.',
  pickupDate: 'October 11, 2026',
  pickupLocation: 'A\'TIN Panay BlockScreening Venue (Cinema Panay / Iloilo Hub)',
  deliveryOptionEnabled: false,
  announcementText: '✨ Pre-orders are strictly open until September 20, 2026. Claiming date is October 11, 2026 on the BlockScreening event day!',
  supportEmail: 'atinpanay.merch@gmail.com',
  organizerName: 'A\'TIN Panay x Team KAAL',
  headerBrandName: 'A\'TIN PANAY',
  headerSubtitle: 'Community Hub & Exclusive Merch',
  headerBadgeText: 'x KAAL',
  capsuleBrandName: 'A\'TIN Panay',
  capsuleSubtitle: 'Official Merch Capsule',
  capsuleBadgeText: 'EXCLUSIVE BATCH',
  capsuleFlagshipBadgeText: 'Flagship Drop',
  capsuleFeaturedTitle: 'BlockScreening T-Shirt (Lavender)',
  capsuleFeaturedSubtitle: 'Premium Cotton • Sizes TS to XXL',
  capsuleFeaturedPriceText: '₱550 - ₱580',
  capsulePartnershipText: 'In partnership with Team KAAL',
  capsuleFanKitButtonText: 'View Fan Kit',
  homepageHeroTitle: 'A\'TIN Panay Community Hub',
  homepageTagline: 'BlockScreening Exclusive Merchandise',
  homepageDescription: 'Official merchandise, fan projects, collections, stories and community updates for A\'TIN Panay.'
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PROD-001',
    title: 'A\'TIN Panay Blockscreening T-Shirt',
    slug: 'atin-panay-blockscreening-tshirt',
    category: 'Apparel',
    description: 'Official premium cotton blockscreening commemorative T-shirt crafted in our signature pastel lavender hue. Featuring exclusive A\'TIN Panay x Team KAAL typography and high-density screen print design.',
    price: 550,
    basePrice: 550,
    xxlPrice: 580,
    color: 'Lavender',
    material: '220 GSM 100% Combed Compact Cotton',
    sizes: ['TS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
    sizeChart: [
      { size: 'TS', width: 17, length: 24 },
      { size: 'XS', width: 18, length: 25 },
      { size: 'S', width: 19, length: 26 },
      { size: 'M', width: 20, length: 27 },
      { size: 'L', width: 21, length: 28 },
      { size: 'XL', width: 22, length: 29 },
      { size: 'XXL', width: 23, length: 30 }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      {
        label: 'Front Mockup',
        url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
      },
      {
        label: 'Back Mockup',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
      },
      {
        label: 'Design Layout',
        url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80'
      },
      {
        label: 'Actual Shirt',
        url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
      },
      {
        label: 'Size Chart',
        url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'
      }
    ],
    isAvailable: true,
    stock: 250,
    featured: true,
    sortOrder: 1
  },
  {
    id: 'PROD-002',
    title: 'A\'TIN Panay Blockscreening Tumbler',
    slug: 'atin-panay-blockscreening-tumbler',
    category: 'Drinkware',
    description: 'Heavy-duty 1200ml insulated stainless steel matte black tumbler. Keeps beverages ice-cold for 24 hours or piping hot for 12 hours. Laser-engraved with A\'TIN Panay x Team KAAL emblem.',
    price: 750,
    basePrice: 750,
    color: 'Matte Stealth Black',
    capacity: '1200ml',
    material: '304 Food-Grade Double Wall Stainless Steel',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      {
        label: 'Product View',
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'
      },
      {
        label: 'Design View',
        url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80'
      }
    ],
    isAvailable: true,
    stock: 150,
    featured: true,
    sortOrder: 2
  },
  {
    id: 'PROD-003',
    title: 'A\'TIN Panay Cloth Banner',
    slug: 'atin-panay-cloth-banner',
    category: 'Merchandise',
    description: 'High-definition full color dye-sublimation cloth banner for concert and blockscreening waving. Durable Polydex fabric with reinforced edges and vibrant SB19 & A\'TIN Panay graphics.',
    price: 280,
    basePrice: 280,
    dimensions: '55cm x 55cm',
    material: 'Premium Polydex Fabric',
    color: 'Lavender / Deep Midnight Blue',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      {
        label: 'Banner Flat View',
        url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'
      },
      {
        label: 'Fabric Texture Detail',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      }
    ],
    isAvailable: true,
    stock: 300,
    featured: true,
    sortOrder: 3
  }
];

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'ADM-001',
    email: 'yeojeam@gmail.com',
    name: 'Yeo Jeam',
    role: 'Super Admin',
    active: true,
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'ADM-002',
    email: 'teamkaal.admin@atinpanay.org',
    name: 'Team KAAL Lead',
    role: 'Admin',
    active: true,
    createdAt: '2026-08-20T10:00:00Z'
  }
];

export const INITIAL_COLLECTIONS: CollectionItem[] = [
  {
    id: 'COL-001',
    title: 'Blockscreening 2026 Capsule',
    description: 'The definitive cinema commemorative pack featuring apparel, drinkware, and banners designed exclusively for Panay fans.',
    category: 'Event Exclusive',
    season: 'September 2026 Drop',
    coverImage: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80',
    status: 'Exclusive',
    releaseYear: '2026',
    itemCount: 3
  },
  {
    id: 'COL-002',
    title: 'SB19 Moonlight Heritage Collection',
    description: 'Archived badges, photocard holders, and holographic stickers celebrating historic milestone releases.',
    category: 'Archive',
    season: 'Past Showcase',
    coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    status: 'Limited Edition',
    releaseYear: '2025',
    itemCount: 8
  }
];

export const INITIAL_FAN_PROJECTS: FanProject[] = [
  {
    id: 'FP-001',
    title: 'Panay Children\'s Foundation Donation Drive',
    category: 'Donation Drives',
    description: 'In honor of SB19 anniversary and the BlockScreening gathering, 10% of overall merchandise proceeds will provide school kits for 150 students in Iloilo and Antique.',
    targetAmount: 35000,
    raisedAmount: 24500,
    organizer: 'A\'TIN Panay Community Outreach Team',
    status: 'Active',
    bannerImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    date: 'September - October 2026',
    impactMetrics: '150 School Kits & Feeding Program'
  },
  {
    id: 'FP-002',
    title: 'SB19 Panay Billboard & Radio Streaming Party',
    category: 'Streaming Projects',
    description: 'Mass streaming campaigns on Spotify and Apple Music, paired with regional LED billboard greetings in festive spots across Iloilo City.',
    targetAmount: 20000,
    raisedAmount: 20000,
    organizer: 'A\'TIN Panay Streamers Guild',
    status: 'Completed',
    bannerImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    date: 'August 2026',
    impactMetrics: '1.2M Targeted Regional Streams'
  },
  {
    id: 'FP-003',
    title: 'Team KAAL Birthday Charity Milestone',
    category: 'Birthday Projects',
    description: 'Celebratory community pantry and tree planting in Panay eco-parks dedicated to our beloved artists.',
    targetAmount: 15000,
    raisedAmount: 11200,
    organizer: 'Team KAAL Projects Committee',
    status: 'Active',
    bannerImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    date: 'October 2026',
    impactMetrics: '300 Native Seedlings Planted'
  }
];

export const INITIAL_LIBRARY_ITEMS: TeamKAALLibraryItem[] = [
  {
    id: 'LIB-001',
    title: 'Constellations Over Iloilo Strait',
    author: 'Team KAAL Writers Guild (Maria & Jo)',
    type: 'Fanfiction',
    description: 'An evocative alternate-universe coming-of-age story centered around music, brotherhood, and dreams blooming amidst the Panay shoreline.',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    tags: ['AU', 'Brotherhood', 'Panay Romance', 'Music'],
    publishedDate: 'August 2026',
    chaptersCount: 12,
    readTimeMinutes: 45,
    contentSnippet: 'The sea breeze swept through Calle Real as the melody echoed from the vintage gramophone. Five silhouettes gathered under the starry Visayan sky...',
    fullText: 'Chapter 1: The Sound of the Waves\n\nThe salt spray clung to the air of the old port. It was the kind of night where every dream felt within arm\'s reach. Justin glanced at the sheet music in his hand, the ink still slightly damp from the evening workshop.\n\n"Are we ready?" Pablo asked, his voice steady against the howling wind. Stell laughed, adjusting his jacket, while Ken tested the acoustic resonance against the colonial stone archways. Josh looked up at the constellations, pointing towards the North Star that guided Panay sailors for generations.\n\nTogether, they took the stage—not just for themselves, but for every voice waiting in the islands to be heard.'
  },
  {
    id: 'LIB-002',
    title: 'A\'TIN Panay: The Five-Year Fan Chronicle',
    author: 'A\'TIN Panay Archival Committee',
    type: 'PDF',
    description: 'A comprehensive 64-page illustrated commemorative archive documenting every cup sleeve event, bus tour, and cinema screening organized across Panay Island.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    tags: ['Archive', 'History', 'Photo Journal', 'Community'],
    publishedDate: 'July 2026',
    chaptersCount: 5,
    readTimeMinutes: 60,
    contentSnippet: 'From modest cafe gatherings in 2021 to full cinema blockscreenings across the region, here is the visual story of Western Visayas A\'TIN.',
    fullText: 'Volume 1: The First Spark (2021-2023)\n\nIt began in a small quiet cafe along Diversion Road. A handful of passionate supporters gathered with handmade banners and a shared dream of bringing SB19 closer to Panay. Year after year, the numbers swelled—from twenty to five hundred, and now to thousands uniting across Iloilo, Capiz, Aklan, and Antique.'
  },
  {
    id: 'LIB-003',
    title: 'Team KAAL Anthology: Voices of the Archipelago',
    author: 'Curated by Team KAAL',
    type: 'Ebook',
    description: 'A collection of poems, short reflections, and artwork submitted by A\'TIN writers exploring themes of resilience, identity, and OPM pride.',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    tags: ['Poetry', 'Essays', 'Anthology', 'Inspiration'],
    publishedDate: 'June 2026',
    chaptersCount: 18,
    readTimeMinutes: 35,
    contentSnippet: 'Words woven like Hablon fabrics, singing of sunrise in the islands and the rhythm of P-Pop resonating in our hearts.',
    fullText: 'Selection 1: The Hablon Weaver of Songs\n\nLike threads of crimson and gold interlaced upon the loom, every chord struck is a salute to our roots. We stand tall on world stages without ever forgetting the soil that nurtured our cadence.'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    fullName: 'Yeo Jeam Admin',
    email: 'yeojeam@gmail.com',
    mobileNumber: '09203963249',
    facebookName: 'Yeo Jeam',
    isVerified: true,
    createdAt: '2026-08-20T10:00:00Z',
    lastLoginAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'CUST-002',
    fullName: 'Clarisse Anne Perez',
    email: 'clarisse.perez@example.com',
    mobileNumber: '09171234567',
    facebookName: 'Clarisse Perez (A\'TIN Iloilo)',
    isVerified: true,
    createdAt: '2026-09-01T02:15:00Z',
    lastLoginAt: '2026-09-01T04:10:00Z'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    orderNumber: 'APMERCH-ORD-00001',
    confirmationNumber: 'APMERCH-CONF-00001',
    customerId: 'CUST-002',
    customerName: 'Clarisse Anne Perez',
    customerEmail: 'clarisse.perez@example.com',
    customerMobile: '09171234567',
    customerFacebook: 'Clarisse Perez (A\'TIN Iloilo)',
    items: [
      {
        id: 'ITEM-001',
        productId: 'PROD-001',
        productTitle: 'A\'TIN Panay Blockscreening T-Shirt',
        productCategory: 'Apparel',
        variant: { size: 'M', color: 'Lavender' },
        unitPrice: 550,
        quantity: 1,
        lineTotal: 550,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 'ITEM-002',
        productId: 'PROD-002',
        productTitle: 'A\'TIN Panay Blockscreening Tumbler',
        productCategory: 'Drinkware',
        variant: { color: 'Matte Stealth Black' },
        unitPrice: 750,
        quantity: 1,
        lineTotal: 750,
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'
      }
    ],
    subtotal: 1300,
    totalAmount: 1300,
    paymentMethod: 'GCash',
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    paymentReferenceNumber: 'GCASH-983471029471',
    paymentSenderName: 'Clarisse Perez',
    paymentSenderNumber: '09171234567',
    paymentStatus: 'Paid',
    status: 'Paid',
    pickupDate: 'October 11, 2026',
    pickupLocation: 'A\'TIN Panay BlockScreening Venue (Cinema Panay / Iloilo Hub)',
    deliveryMethod: 'Pickup Only',
    createdAt: '2026-09-01T02:30:00Z',
    updatedAt: '2026-09-01T03:00:00Z',
    verifiedBy: 'yeojeam@gmail.com',
    verifiedAt: '2026-09-01T03:00:00Z',
    notes: 'Payment verified via GCash reference. Ready for assembly.'
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-001',
    orderNumber: 'APMERCH-ORD-00001',
    confirmationNumber: 'APMERCH-CONF-00001',
    customerEmail: 'clarisse.perez@example.com',
    customerName: 'Clarisse Anne Perez',
    amount: 1300,
    method: 'GCash',
    senderName: 'Clarisse Perez',
    senderNumber: '09171234567',
    referenceNumber: 'GCASH-983471029471',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    status: 'Paid',
    verifiedBy: 'yeojeam@gmail.com',
    verifiedAt: '2026-09-01T03:00:00Z',
    createdAt: '2026-09-01T02:30:00Z',
    notes: 'GCash receipt validated.'
  }
];

export const INITIAL_EMAIL_LOGS: EmailLog[] = [
  {
    id: 'EML-001',
    toEmail: 'clarisse.perez@example.com',
    recipientName: 'Clarisse Anne Perez',
    subject: 'Order Submitted - A\'TIN Panay BlockScreening [APMERCH-ORD-00001]',
    templateType: 'Order Submitted',
    orderNumber: 'APMERCH-ORD-00001',
    status: 'Sent',
    sentAt: '2026-09-01T02:30:05Z',
    previewBody: 'Thank you for your order APMERCH-ORD-00001. We have received your GCash payment proof and our admin is verifying it.'
  },
  {
    id: 'EML-002',
    toEmail: 'clarisse.perez@example.com',
    recipientName: 'Clarisse Anne Perez',
    subject: 'Payment Approved - A\'TIN Panay BlockScreening [APMERCH-ORD-00001]',
    templateType: 'Payment Approved',
    orderNumber: 'APMERCH-ORD-00001',
    status: 'Sent',
    sentAt: '2026-09-01T03:00:02Z',
    previewBody: 'Your payment of 1,300 PHP has been verified and approved! Please keep your E-Order ticket handy for October 11, 2026 claiming.'
  }
];
