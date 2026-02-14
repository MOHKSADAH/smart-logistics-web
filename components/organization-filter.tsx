"use client";

/**
 * Organization Filter Component
 *
 * Dropdown filter to select a specific organization.
 * Persists selection in URL params for easy sharing.
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
}

interface OrganizationFilterProps {
  organizations: Organization[];
}

export function OrganizationFilter({ organizations }: OrganizationFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get("organizationId");

  const handleOrganizationChange = (organizationId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (organizationId === "all") {
      params.delete("organizationId");
    } else {
      params.set("organizationId", organizationId);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select
        value={currentOrgId || "all"}
        onValueChange={handleOrganizationChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Organizations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Organizations</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
