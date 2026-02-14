import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function POST() {
  try {
    const supabase = getServerSupabaseClient();

    // Get organizations
    const { data: organizations } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("is_active", true)
      .limit(3);

    if (!organizations || organizations.length === 0) {
      return NextResponse.json(
        { success: false, message: "No organizations found" },
        { status: 404 },
      );
    }

    // Job templates with mixed priorities - expanded to 20+ jobs
    const jobTemplates = [
      // EMERGENCY Priority (4 jobs)
      {
        cargo_type: "PERISHABLE",
        priority: "EMERGENCY",
        customer_name: "Saudi Fresh Foods",
        container_number: `PER${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "MEDICAL",
        priority: "EMERGENCY",
        customer_name: "King Fahd Hospital",
        container_number: `MED${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "MEDICAL",
        priority: "EMERGENCY",
        customer_name: "King Saud Medical City",
        container_number: `MED${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "HAZARDOUS",
        priority: "EMERGENCY",
        customer_name: "SABIC Chemicals",
        container_number: `HAZ${Math.floor(Math.random() * 10000)}`,
      },
      // ESSENTIAL Priority (6 jobs)
      {
        cargo_type: "TIME_SENSITIVE",
        priority: "ESSENTIAL",
        customer_name: "Noon E-commerce",
        container_number: `TS${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "TIME_SENSITIVE",
        priority: "ESSENTIAL",
        customer_name: "Jarir Bookstore",
        container_number: `TS${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "TIME_SENSITIVE",
        priority: "ESSENTIAL",
        customer_name: "Extra Electronics",
        container_number: `TS${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "TIME_SENSITIVE",
        priority: "ESSENTIAL",
        customer_name: "Saudi Post (SPL)",
        container_number: `TS${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "TIME_SENSITIVE",
        priority: "ESSENTIAL",
        customer_name: "Aramex Express",
        container_number: `TS${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "TIME_SENSITIVE",
        priority: "ESSENTIAL",
        customer_name: "Hungerstation Logistics",
        container_number: `TS${Math.floor(Math.random() * 10000)}`,
      },
      // NORMAL Priority (8 jobs)
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Al Othaim Markets",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Lulu Hypermarket",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Carrefour SA",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Danube Company",
        container_number: `CNT${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Panda Retail",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Al Rajhi Retail",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "BinDawood Markets",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "STANDARD",
        priority: "NORMAL",
        customer_name: "Farm Superstores",
        container_number: `STD${Math.floor(Math.random() * 10000)}`,
      },
      // LOW Priority (4 jobs)
      {
        cargo_type: "BULK",
        priority: "LOW",
        customer_name: "Saudi Cement Co",
        container_number: `BLK${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "BULK",
        priority: "LOW",
        customer_name: "Yamama Cement",
        container_number: `BLK${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "BULK",
        priority: "LOW",
        customer_name: "Saudi Steel Co",
        container_number: `BLK${Math.floor(Math.random() * 10000)}`,
      },
      {
        cargo_type: "OTHER",
        priority: "LOW",
        customer_name: "General Cargo Ltd",
        container_number: `OTH${Math.floor(Math.random() * 10000)}`,
      },
    ];

    // Create jobs with job_number
    const jobsToCreate = jobTemplates.map((template, index) => {
      const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const jobNumber = `JOB-${dateStr}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`;

      return {
        organization_id: organizations[index % organizations.length].id,
        job_number: jobNumber,
        customer_name: template.customer_name,
        container_number: template.container_number,
        container_count: Math.floor(Math.random() * 3) + 1,
        cargo_type: template.cargo_type,
        priority: template.priority,
        pickup_location: "Dammam Port",
        destination: [
          "Riyadh Distribution Center",
          "Jeddah Warehouse",
          "Al Khobar Logistics Hub",
          "Dhahran Industrial Zone",
        ][Math.floor(Math.random() * 4)],
        preferred_date: new Date(
          Date.now() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split("T")[0],
        preferred_time: ["08:00", "10:00", "14:00", "18:00", "22:00"][
          Math.floor(Math.random() * 5)
        ],
        notes: `Demo job - ${template.priority} priority`,
        status: "PENDING",
      };
    });

    const { data: jobs, error } = await supabase
      .from("jobs")
      .insert(jobsToCreate)
      .select();

    if (error) {
      console.error("Failed to create demo jobs:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create jobs",
          error: error.message,
        },
        { status: 500 },
      );
    }

    // Count by priority
    const priorityCounts = jobs.reduce((acc: Record<string, number>, job) => {
      acc[job.priority] = (acc[job.priority] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: `Created ${jobs.length} demo jobs`,
      data: {
        total: jobs.length,
        by_priority: priorityCounts,
        organizations: organizations.map((org) => org.name),
      },
    });
  } catch (error) {
    console.error("Demo create-jobs error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
