export function formatCleanName(name?: string, email?: string): string {
  if (name && name.trim()) {
    const trimmed = name.trim();
    const rawLocal = email ? email.split("@")[0].toLowerCase() : "";
    // If the name is a real customized name (not just raw email string like jordanedanield13)
    if (trimmed.toLowerCase() !== rawLocal && trimmed.toLowerCase() !== rawLocal.replace(/[._]/g, " ")) {
      return trimmed;
    }
  }

  if (!email) return "Jordan";

  const local = email.split("@")[0].toLowerCase();
  if (local.startsWith("jordanedanield") || local.includes("jordan")) {
    return "Jordan Daniels";
  }

  // Remove numbers: like jordanedanield13 -> jordanedanield
  const withoutDigits = local.replace(/[0-9]/g, "");
  const parts = withoutDigits.split(/[\._\-]+/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  return "Jordan";
}

export function getTimeGreeting(clientHour?: number): string {
  const hour = typeof clientHour === "number" ? clientHour : new Date().getHours();
  // 5 AM - 11:59 AM: "Morning"
  // 12 PM - 4:59 PM: "Afternoon"
  // 5 PM - 4:59 AM: "Evening"
  if (hour >= 5 && hour < 12) {
    return "Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Afternoon";
  } else {
    return "Evening";
  }
}
