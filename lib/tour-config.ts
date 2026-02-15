import { DriveStep } from "driver.js";

// Admin Dashboard Tour Steps - English
export const adminDashboardTourEn: DriveStep[] = [
  {
    element: '[data-tour="traffic-status"]',
    popover: {
      title: "Real-Time Traffic Monitoring",
      description: "Live traffic status from AI cameras. System automatically detects NORMAL, MODERATE, or CONGESTED conditions.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="vessel-widget"]',
    popover: {
      title: "🚢 Vessel-Driven Predictions",
      description: "PORTA's secret sauce! When vessels arrive (7-9am), containers are ready 2-4 hours later. This predicts the 10am-2pm truck surge.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="priority-protection"]',
    popover: {
      title: "🛡️ Priority Protection System",
      description: "EMERGENCY cargo is NEVER halted. During congestion, only NORMAL & LOW priority permits are delayed. This is the core innovation.",
      side: "bottom",
      align: "start",
    },
  },
];

// Admin Dashboard Tour Steps - Arabic
export const adminDashboardTourAr: DriveStep[] = [
  {
    element: '[data-tour="traffic-status"]',
    popover: {
      title: "مراقبة حركة المرور في الوقت الفعلي",
      description: "حالة المرور المباشرة من كاميرات الذكاء الاصطناعي. النظام يكتشف تلقائياً الحالات: عادي، متوسط، أو مزدحم.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="vessel-widget"]',
    popover: {
      title: "🚢 التنبؤ بناءً على السفن",
      description: "السر وراء PORTA! عندما تصل السفن (7-9 صباحاً)، الحاويات تكون جاهزة بعد 2-4 ساعات. هذا يتنبأ بذروة الشاحنات 10 صباحاً-2 ظهراً.",
      side: "left",
      align: "start",
    },
  },
  {
    element: '[data-tour="priority-protection"]',
    popover: {
      title: "🛡️ نظام حماية الأولوية",
      description: "البضائع الطارئة لا تتوقف أبداً! عند الازدحام، فقط التصاريح العادية والمنخفضة تتأخر. هذا هو الابتكار الأساسي.",
      side: "bottom",
      align: "start",
    },
  },
];

// Organization Dashboard Tour Steps - English
export const orgDashboardTourEn: DriveStep[] = [
  {
    element: '[data-tour="create-job-button"]',
    popover: {
      title: "Organization-Based System",
      description: "Organizations create jobs, not drivers! This is different from traditional systems where drivers book individually.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="recent-jobs"]',
    popover: {
      title: "Real-Time Job Tracking",
      description: "Click any job to see: driver location (GPS), permit status, vessel warnings, and timeline. Full visibility.",
      side: "top",
      align: "start",
    },
  },
];

// Organization Dashboard Tour Steps - Arabic
export const orgDashboardTourAr: DriveStep[] = [
  {
    element: '[data-tour="create-job-button"]',
    popover: {
      title: "نظام قائم على المؤسسات",
      description: "المؤسسات تنشئ الوظائف، وليس السائقون! هذا يختلف عن الأنظمة التقليدية حيث السائقون يحجزون بشكل فردي.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="recent-jobs"]',
    popover: {
      title: "تتبع الوظائف في الوقت الفعلي",
      description: "انقر على أي وظيفة لرؤية: موقع السائق (GPS)، حالة التصريح، تحذيرات السفن، والجدول الزمني. رؤية كاملة.",
      side: "top",
      align: "start",
    },
  },
];

// Get tour steps based on dashboard type and language
export function getTourSteps(isOrgDashboard: boolean, locale: string): DriveStep[] {
  if (isOrgDashboard) {
    return locale === "ar" ? orgDashboardTourAr : orgDashboardTourEn;
  }
  return locale === "ar" ? adminDashboardTourAr : adminDashboardTourEn;
}

// Tour completion callback
export const onTourComplete = (redirectUrl: string) => {
  // Mark tour as seen
  sessionStorage.setItem("porta_demo_tour_seen", "true");

  // Redirect to regular dashboard (remove ?demo=true)
  window.location.href = redirectUrl;
};
