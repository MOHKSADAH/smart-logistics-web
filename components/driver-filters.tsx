"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DriverFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const vehicleType = searchParams.get("vehicleType");

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (vehicleType && vehicleType !== "all") params.set("vehicleType", vehicleType);

    router.push(`/drivers?${params.toString()}`);
  };

  const handleVehicleTypeChange = (value: string) => {
    const search = searchParams.get("search");
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (value !== "all") params.set("vehicleType", value);

    router.push(`/drivers?${params.toString()}`);
  };

  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <form onSubmit={handleSearch}>
          <Input
            name="search"
            placeholder="Search by name, phone, or plate number..."
            defaultValue={searchParams.get("search") || ""}
            className="pl-10"
          />
        </form>
      </div>
      <Select
        value={searchParams.get("vehicleType") || "all"}
        onValueChange={handleVehicleTypeChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Vehicle Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vehicle Types</SelectItem>
          <SelectItem value="TRUCK">Truck</SelectItem>
          <SelectItem value="TRAILER">Trailer</SelectItem>
          <SelectItem value="CONTAINER">Container</SelectItem>
          <SelectItem value="FLATBED">Flatbed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
