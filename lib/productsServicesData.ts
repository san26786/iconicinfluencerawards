export type ServiceItem = { name: string };

export type ServiceSubcategory = {
  id: string;
  name: string;
  items: ServiceItem[];
};

export type ServiceCategory = {
  id: string;
  label: string;
  icon: string;
  subcategories: ServiceSubcategory[];
};

export const PRODUCTS_SERVICES_CATEGORIES: ServiceCategory[] = [
  {
    id: 'nominees',
    label: 'Revenue from Nominees & Applicants',
    icon: 'FileText',
    subcategories: [
      {
        id: 'entry_fees',
        name: 'Entry Fees',
        items: [
          { name: 'Nomination fee' },
          { name: 'Application fee' },
          { name: 'Multiple category fee' },
          { name: 'Premium category fee' },
          { name: 'Express review fee' },
          { name: 'Late submission fee' },
        ],
      },
      {
        id: 'premium_app',
        name: 'Premium Application Services',
        items: [
          { name: 'Application writing assistance' },
          { name: 'Professional proofreading' },
          { name: 'Award submission consultancy' },
          { name: 'Video application production' },
          { name: 'Business profile writing' },
          { name: 'Executive biography writing' },
          { name: 'Evidence preparation' },
          { name: 'PDF design' },
          { name: 'Presentation design' },
        ],
      },
      {
        id: 'branding',
        name: 'Branding Packages',
        items: [
          { name: 'Featured nominee profile' },
          { name: 'Homepage spotlight' },
          { name: 'Social media promotion' },
          { name: 'Interview article' },
          { name: 'Podcast appearance' },
          { name: 'Video interview' },
          { name: 'Featured newsletter' },
          { name: 'PR distribution' },
        ],
      },
      {
        id: 'training',
        name: 'Training',
        items: [
          { name: 'How to win awards workshop' },
          { name: 'Award writing masterclass' },
          { name: 'Presentation coaching' },
          { name: 'Interview coaching' },
          { name: 'Leadership coaching' },
        ],
      },
    ],
  },
  {
    id: 'winners',
    label: 'Revenue from Winners',
    icon: 'Trophy',
    subcategories: [
      {
        id: 'winner_products',
        name: 'Winner Products',
        items: [
          { name: 'Winner logos' },
          { name: 'Winner certificates' },
          { name: 'Premium framed certificates' },
          { name: 'Crystal trophies' },
          { name: 'Duplicate trophies' },
          { name: 'Office plaques' },
          { name: 'Desk awards' },
          { name: 'Digital winner badges' },
          { name: 'Email signatures' },
          { name: 'LinkedIn graphics' },
          { name: 'Press release packages' },
          { name: 'Winner announcement videos' },
          { name: 'Documentary videos' },
        ],
      },
      {
        id: 'winner_marketing',
        name: 'Marketing Packages',
        items: [
          { name: 'Winner magazine feature' },
          { name: 'Winner podcast' },
          { name: 'Case study' },
          { name: 'Success story' },
          { name: 'Website spotlight' },
          { name: 'Sponsored interview' },
          { name: 'Founder interview' },
        ],
      },
    ],
  },
  {
    id: 'sponsors',
    label: 'Revenue from Sponsors',
    icon: 'Handshake',
    subcategories: [
      {
        id: 'sponsorship_packages',
        name: 'Sponsorship Packages',
        items: [
          { name: 'Title Sponsor' },
          { name: 'Powered By Sponsor' },
          { name: 'Presenting Sponsor' },
          { name: 'Platinum Sponsor' },
          { name: 'Gold Sponsor' },
          { name: 'Silver Sponsor' },
          { name: 'Bronze Sponsor' },
          { name: 'Category Sponsor' },
          { name: 'Trophy Sponsor' },
          { name: 'Dinner Sponsor' },
          { name: 'Drinks Sponsor' },
          { name: 'Welcome Sponsor' },
          { name: 'Red Carpet Sponsor' },
          { name: 'VIP Lounge Sponsor' },
          { name: 'After Party Sponsor' },
          { name: 'Entertainment Sponsor' },
          { name: 'Registration Sponsor' },
          { name: 'Lanyard Sponsor' },
          { name: 'Badge Sponsor' },
          { name: 'Stage Sponsor' },
          { name: 'Gift Bag Sponsor' },
          { name: 'Sustainability Sponsor' },
        ],
      },
      {
        id: 'digital_sponsorship',
        name: 'Digital Sponsorship',
        items: [
          { name: 'Website banner' },
          { name: 'Mobile app sponsorship' },
          { name: 'Newsletter sponsor' },
          { name: 'Livestream sponsor' },
          { name: 'Email sponsor' },
          { name: 'Category page sponsor' },
          { name: 'Digital voting sponsor' },
        ],
      },
    ],
  },
  {
    id: 'partners',
    label: 'Revenue from Partners',
    icon: 'Network',
    subcategories: [
      {
        id: 'partnership_tiers',
        name: 'Partnership Tiers',
        items: [
          { name: 'Strategic Partner' },
          { name: 'Industry Partner' },
          { name: 'Innovation Partner' },
          { name: 'Government Partner' },
          { name: 'University Partner' },
          { name: 'Chamber Partner' },
          { name: 'Media Partner' },
          { name: 'Technology Partner' },
          { name: 'Charity Partner' },
        ],
      },
    ],
  },
  {
    id: 'exhibitors',
    label: 'Revenue from Exhibitors',
    icon: 'Store',
    subcategories: [
      {
        id: 'booth_packages',
        name: 'Booth Packages',
        items: [
          { name: 'Startup Booth' },
          { name: 'Standard Booth' },
          { name: 'Premium Booth' },
          { name: 'Corner Booth' },
          { name: 'Island Booth' },
          { name: 'Outdoor Booth' },
        ],
      },
      {
        id: 'booth_extras',
        name: 'Extras',
        items: [
          { name: 'Electricity' },
          { name: 'Furniture' },
          { name: 'Internet' },
          { name: 'Branding' },
          { name: 'Lead scanner' },
          { name: 'Extra staff passes' },
          { name: 'Storage' },
        ],
      },
    ],
  },
  {
    id: 'advertisers',
    label: 'Revenue from Advertisers',
    icon: 'Megaphone',
    subcategories: [
      {
        id: 'digital_ads',
        name: 'Digital Advertising',
        items: [
          { name: 'Homepage banners' },
          { name: 'Category banners' },
          { name: 'Newsletter ads' },
          { name: 'Email ads' },
          { name: 'App banners' },
          { name: 'Push notifications' },
        ],
      },
      {
        id: 'event_ads',
        name: 'Event Advertising',
        items: [
          { name: 'LED screen ads' },
          { name: 'Stage backdrop' },
          { name: 'Program guide' },
          { name: 'Welcome screen' },
          { name: 'Registration desk' },
          { name: 'Photo wall' },
          { name: 'Trophy table' },
          { name: 'Red carpet' },
          { name: 'Seat branding' },
        ],
      },
    ],
  },
  {
    id: 'attendees',
    label: 'Revenue from Attendees',
    icon: 'Ticket',
    subcategories: [
      {
        id: 'tickets',
        name: 'Tickets',
        items: [
          { name: 'Early Bird' },
          { name: 'Standard' },
          { name: 'VIP' },
          { name: 'Premium VIP' },
          { name: 'Student' },
          { name: 'Group' },
          { name: 'Corporate Tables' },
          { name: 'Hospitality Package' },
        ],
      },
      {
        id: 'ticket_addons',
        name: 'Add-ons',
        items: [
          { name: 'Networking lunch' },
          { name: 'VIP dinner' },
          { name: 'Meet speakers' },
          { name: 'Fast-track registration' },
          { name: 'Premium seating' },
        ],
      },
    ],
  },
  {
    id: 'judges',
    label: 'Revenue from Judges',
    icon: 'Scale',
    subcategories: [
      {
        id: 'judge_opportunities',
        name: 'Judge Opportunities',
        items: [
          { name: 'Judge networking dinner' },
          { name: 'Judge summit' },
          { name: 'Judge directory' },
          { name: 'Judge certification' },
          { name: 'Judge masterclass' },
          { name: 'Speaking opportunities' },
          { name: 'Consulting marketplace' },
        ],
      },
    ],
  },
  {
    id: 'speakers',
    label: 'Revenue from Speakers',
    icon: 'Mic',
    subcategories: [
      {
        id: 'speaker_packages',
        name: 'Speaker Packages',
        items: [
          { name: 'Speaker profile' },
          { name: 'Sponsored keynote' },
          { name: 'Workshop' },
          { name: 'Masterclass' },
          { name: 'Meet-and-greet' },
          { name: 'Book signing' },
          { name: 'Sponsored sessions' },
        ],
      },
    ],
  },
  {
    id: 'performers',
    label: 'Revenue from Performers',
    icon: 'Music',
    subcategories: [
      {
        id: 'performer_revenue',
        name: 'Performer Revenue',
        items: [
          { name: 'Performance sponsorship' },
          { name: 'Album promotion' },
          { name: 'Merchandise sales' },
          { name: 'VIP meet-and-greet' },
          { name: 'Paid autograph sessions' },
          { name: 'Music streaming promotion' },
        ],
      },
    ],
  },
  {
    id: 'media',
    label: 'Revenue from Media',
    icon: 'Newspaper',
    subcategories: [
      {
        id: 'media_packages',
        name: 'Media Packages',
        items: [
          { name: 'Press passes' },
          { name: 'Exclusive interview rights' },
          { name: 'Broadcast rights' },
          { name: 'Live stream licensing' },
          { name: 'Photography licensing' },
          { name: 'Content syndication' },
        ],
      },
    ],
  },
  {
    id: 'streaming',
    label: 'Revenue from Live Streaming',
    icon: 'Radio',
    subcategories: [
      {
        id: 'streaming_products',
        name: 'Streaming Products',
        items: [
          { name: 'Virtual tickets' },
          { name: 'HD replay access' },
          { name: 'Premium backstage stream' },
          { name: 'On-demand recordings' },
          { name: 'Multi-language commentary' },
        ],
      },
    ],
  },
  {
    id: 'memberships',
    label: 'Memberships',
    icon: 'Crown',
    subcategories: [
      {
        id: 'membership_tiers',
        name: 'Membership Tiers',
        items: [
          { name: 'Bronze' },
          { name: 'Silver' },
          { name: 'Gold' },
          { name: 'Platinum' },
        ],
      },
      {
        id: 'member_benefits',
        name: 'Member Benefits',
        items: [
          { name: 'Discounts' },
          { name: 'Priority nominations' },
          { name: 'VIP networking' },
          { name: 'Exclusive webinars' },
          { name: 'Business directory' },
          { name: 'Monthly events' },
          { name: 'Award credits' },
        ],
      },
    ],
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'GraduationCap',
    subcategories: [
      {
        id: 'learning_products',
        name: 'Learning Products',
        items: [
          { name: 'Award Academy' },
          { name: 'Leadership Academy' },
          { name: 'Online courses' },
          { name: 'Certification' },
          { name: 'Workshops' },
          { name: 'Mentoring' },
          { name: 'Coaching' },
          { name: 'Executive programs' },
        ],
      },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    icon: 'Users',
    subcategories: [
      {
        id: 'community_channels',
        name: 'Community Channels',
        items: [
          { name: 'Forums' },
          { name: 'Slack/Discord' },
          { name: 'WhatsApp groups' },
          { name: 'Networking' },
          { name: 'Monthly meetups' },
          { name: 'Regional events' },
        ],
      },
    ],
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    icon: 'Briefcase',
    subcategories: [
      {
        id: 'talent_marketplace',
        name: 'Talent Marketplace',
        items: [
          { name: 'Job listings' },
          { name: 'Executive recruitment' },
          { name: 'Featured employer' },
          { name: 'Resume database' },
        ],
      },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'ShoppingBag',
    subcategories: [
      {
        id: 'marketplace_listings',
        name: 'Marketplace Listings',
        items: [
          { name: 'Products' },
          { name: 'Services' },
          { name: 'Consulting' },
          { name: 'Software' },
          { name: 'Franchises' },
          { name: 'Licenses' },
        ],
      },
    ],
  },
  {
    id: 'directory',
    label: 'Awards Directory',
    icon: 'BookOpen',
    subcategories: [
      {
        id: 'directory_packages',
        name: 'Directory Packages',
        items: [
          { name: 'Featured listing' },
          { name: 'Verified badge' },
          { name: 'Premium profile' },
          { name: 'Homepage placement' },
        ],
      },
    ],
  },
  {
    id: 'lead_gen',
    label: 'Lead Generation',
    icon: 'Target',
    subcategories: [
      {
        id: 'lead_packages',
        name: 'Lead Packages',
        items: [
          { name: 'Leads for Sponsors' },
          { name: 'Leads for Partners' },
          { name: 'Leads for Exhibitors' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'BarChart2',
    subcategories: [
      {
        id: 'industry_reports',
        name: 'Industry Reports',
        items: [
          { name: 'Market reports' },
          { name: 'Industry rankings' },
          { name: 'Salary reports' },
          { name: 'Innovation reports' },
          { name: 'ESG reports' },
          { name: 'AI reports' },
        ],
      },
    ],
  },
  {
    id: 'certification',
    label: 'Certification',
    icon: 'BadgeCheck',
    subcategories: [
      {
        id: 'cert_products',
        name: 'Certification Products',
        items: [
          { name: 'Certified Business' },
          { name: 'Verified Business' },
          { name: 'Trusted Employer' },
          { name: 'Women Friendly Employer' },
          { name: 'ESG Certified' },
        ],
      },
    ],
  },
  {
    id: 'licensing',
    label: 'Licensing',
    icon: 'Key',
    subcategories: [
      {
        id: 'license_types',
        name: 'License Types',
        items: [
          { name: 'Regional awards' },
          { name: 'City awards' },
          { name: 'Industry awards' },
          { name: 'Country awards' },
        ],
      },
    ],
  },
  {
    id: 'white_label',
    label: 'White Label Platform',
    icon: 'Monitor',
    subcategories: [
      {
        id: 'wl_customers',
        name: 'Target Customers',
        items: [
          { name: 'Chambers' },
          { name: 'Associations' },
          { name: 'Governments' },
          { name: 'Universities' },
          { name: 'Corporates' },
        ],
      },
      {
        id: 'wl_pricing',
        name: 'Pricing Models',
        items: [
          { name: 'Setup fee' },
          { name: 'Monthly subscription' },
          { name: 'Per-event fee' },
          { name: 'Enterprise license' },
        ],
      },
    ],
  },
  {
    id: 'ai_services',
    label: 'AI Services',
    icon: 'Bot',
    subcategories: [
      {
        id: 'ai_tools',
        name: 'AI Tools',
        items: [
          { name: 'AI application reviewer' },
          { name: 'AI eligibility checker' },
          { name: 'AI writing assistant' },
          { name: 'AI scoring support' },
          { name: 'AI judge assistant' },
          { name: 'AI press release generator' },
          { name: 'AI certificate generator' },
          { name: 'AI speech writer' },
          { name: 'AI nomination assistant' },
        ],
      },
    ],
  },
  {
    id: 'merchandise',
    label: 'Merchandise',
    icon: 'Shirt',
    subcategories: [
      {
        id: 'branded_items',
        name: 'Branded Items',
        items: [
          { name: 'T-shirts' },
          { name: 'Hoodies' },
          { name: 'Caps' },
          { name: 'Mugs' },
          { name: 'Pens' },
          { name: 'Bags' },
          { name: 'Trophy replicas' },
          { name: 'Pins' },
          { name: 'Lanyards' },
          { name: 'Notebooks' },
        ],
      },
    ],
  },
  {
    id: 'vip_experiences',
    label: 'VIP Experiences',
    icon: 'Star',
    subcategories: [
      {
        id: 'premium_packages',
        name: 'Premium Packages',
        items: [
          { name: 'CEO Dinner' },
          { name: 'Investors Dinner' },
          { name: 'Yacht networking' },
          { name: 'Golf day' },
          { name: 'Business retreat' },
          { name: 'Wine tasting' },
          { name: 'Factory tours' },
          { name: 'Private mastermind' },
        ],
      },
    ],
  },
  {
    id: 'networking',
    label: 'Networking',
    icon: 'Share2',
    subcategories: [
      {
        id: 'networking_products',
        name: 'Networking Products',
        items: [
          { name: 'Speed networking' },
          { name: 'Roundtables' },
          { name: 'CEO Club' },
          { name: 'Investor Club' },
          { name: 'Startup matchmaking' },
          { name: 'Supplier matchmaking' },
        ],
      },
    ],
  },
  {
    id: 'data_analytics',
    label: 'Data & Analytics',
    icon: 'LineChart',
    subcategories: [
      {
        id: 'data_products',
        name: 'Data Products',
        items: [
          { name: 'Benchmark reports' },
          { name: 'Industry comparisons' },
          { name: 'Competitor insights' },
          { name: 'Performance dashboards' },
          { name: 'Award history' },
        ],
      },
    ],
  },
  {
    id: 'digital_assets',
    label: 'Digital Assets',
    icon: 'Download',
    subcategories: [
      {
        id: 'downloadable_content',
        name: 'Downloadable Content',
        items: [
          { name: 'Templates' },
          { name: 'Business toolkits' },
          { name: 'Policy packs' },
          { name: 'HR templates' },
          { name: 'Marketing templates' },
          { name: 'Award submission kits' },
        ],
      },
    ],
  },
  {
    id: 'year_round',
    label: 'Year-Round Events',
    icon: 'CalendarDays',
    subcategories: [
      {
        id: 'event_types',
        name: 'Event Types',
        items: [
          { name: 'Breakfast briefings' },
          { name: 'CEO forums' },
          { name: 'Webinars' },
          { name: 'Summits' },
          { name: 'Conferences' },
          { name: 'Masterclasses' },
          { name: 'Local networking events' },
          { name: 'Investor showcases' },
          { name: 'Product launches' },
          { name: 'Innovation expos' },
          { name: 'Awards gala' },
        ],
      },
    ],
  },
];

export const ALL_PRODUCTS_FLAT = PRODUCTS_SERVICES_CATEGORIES.flatMap(cat =>
  cat.subcategories.flatMap(sub =>
    sub.items.map(item => ({ ...item, category: cat.label, subcategory: sub.name, category_id: cat.id })),
  ),
);
