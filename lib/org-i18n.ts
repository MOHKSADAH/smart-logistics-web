export const orgTranslations = {
  en: {
    // Login page
    loginTitle: "Organization Portal",
    loginSubtitle: "Login to manage your fleet and jobs",
    email: "Email",
    password: "Password",
    loginButton: "Login",
    loggingIn: "Logging in...",
    demoCredentials: "Demo Credentials",

    // Navigation
    dashboard: "Dashboard",
    jobs: "Jobs",
    drivers: "Drivers",
    logout: "Logout",

    // Dashboard
    welcomeBack: "Welcome back",
    totalJobs: "Total Jobs",
    activeJobs: "Active Jobs",
    completedJobs: "Completed Jobs",
    availableDrivers: "Available Drivers",
    todayJobs: "Today's Jobs",
    viewAll: "View All",

    // Jobs
    createJob: "Create Job",
    allJobs: "All Jobs",
    jobNumber: "Job Number",
    customer: "Customer",
    cargo: "Cargo",
    priority: "Priority",
    driver: "Driver",
    status: "Status",
    permit: "Permit",
    autoAssign: "Auto-Assign",

    // Job creation
    createNewJob: "Create New Job",
    customerName: "Customer Name",
    containerNumber: "Container Number",
    containerCount: "Container Count",
    cargoType: "Cargo Type",
    pickupLocation: "Pickup Location",
    destination: "Destination",
    preferredDate: "Preferred Date",
    preferredTime: "Preferred Time",
    notes: "Notes",
    submitJob: "Create Job",

    // Cargo types
    PERISHABLE: "Perishable",
    MEDICAL: "Medical",
    TIME_SENSITIVE: "Time Sensitive",
    STANDARD: "Standard",
    BULK: "Bulk",

    // Priority levels
    EMERGENCY: "Emergency",
    ESSENTIAL: "Essential",
    NORMAL: "Normal",
    LOW: "Low",

    // Status
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",

    // Drivers
    allDrivers: "All Drivers",
    registerDriver: "Register Driver",
    driverName: "Driver Name",
    phone: "Phone",
    vehiclePlate: "Vehicle Plate",
    vehicleType: "Vehicle Type",
    available: "Available",
    unavailable: "Unavailable",
  },

  ar: {
    // Login page
    loginTitle: "بوابة المنظمات",
    loginSubtitle: "تسجيل الدخول لإدارة أسطولك ووظائفك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loginButton: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    demoCredentials: "بيانات تجريبية",

    // Navigation
    dashboard: "لوحة التحكم",
    jobs: "الوظائف",
    drivers: "السائقون",
    logout: "تسجيل الخروج",

    // Dashboard
    welcomeBack: "مرحباً بعودتك",
    totalJobs: "إجمالي الوظائف",
    activeJobs: "الوظائف النشطة",
    completedJobs: "الوظائف المكتملة",
    availableDrivers: "السائقون المتاحون",
    todayJobs: "وظائف اليوم",
    viewAll: "عرض الكل",

    // Jobs
    createJob: "إنشاء وظيفة",
    allJobs: "جميع الوظائف",
    jobNumber: "رقم الوظيفة",
    customer: "العميل",
    cargo: "البضائع",
    priority: "الأولوية",
    driver: "السائق",
    status: "الحالة",
    permit: "التصريح",
    autoAssign: "تعيين تلقائي",

    // Job creation
    createNewJob: "إنشاء وظيفة جديدة",
    customerName: "اسم العميل",
    containerNumber: "رقم الحاوية",
    containerCount: "عدد الحاويات",
    cargoType: "نوع البضائع",
    pickupLocation: "موقع الاستلام",
    destination: "الوجهة",
    preferredDate: "التاريخ المفضل",
    preferredTime: "الوقت المفضل",
    notes: "ملاحظات",
    submitJob: "إنشاء الوظيفة",

    // Cargo types
    PERISHABLE: "قابل للتلف",
    MEDICAL: "طبي",
    TIME_SENSITIVE: "حساس للوقت",
    STANDARD: "قياسي",
    BULK: "بالجملة",

    // Priority levels
    EMERGENCY: "طارئ",
    ESSENTIAL: "أساسي",
    NORMAL: "عادي",
    LOW: "منخفض",

    // Status
    PENDING: "قيد الانتظار",
    ASSIGNED: "معين",
    IN_PROGRESS: "قيد التنفيذ",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",

    // Drivers
    allDrivers: "جميع السائقين",
    registerDriver: "تسجيل سائق",
    driverName: "اسم السائق",
    phone: "الهاتف",
    vehiclePlate: "لوحة المركبة",
    vehicleType: "نوع المركبة",
    available: "متاح",
    unavailable: "غير متاح",
  },
};

export type Locale = 'en' | 'ar';

export function getOrgTranslation(locale: Locale, key: keyof typeof orgTranslations.en): string {
  return orgTranslations[locale][key] || orgTranslations.en[key];
}
