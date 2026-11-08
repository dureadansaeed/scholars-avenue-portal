import type { ApplicationRouteType as R, Country } from "@/types";

// SAMPLE DATA: the 12 supported countries (PRD 7.6.1A). Rules and notes are
// placeholders for administrators to maintain, not verified guidance.
const c = (code: string, name: string, region: string, currency: string, intakeLabels: string[],
  routes: R[], programs: number, verified: number, extra: Partial<Country> = {}): Country => ({
  code, name, region, currency, active: true, intakeLabels, routes,
  catalogProgress: { programs, verified }, ...extra,
});

export const countries: Country[] = [
  c("DE", "Germany", "Europe", "EUR", ["Winter", "Summer"], ["uni_assist", "direct_portal"], 2, 1,
    { gradingNote: "Grades are assessed per institution; conversion is informational only.", processNote: "Many universities use Uni-Assist; some use their own portal." }),
  c("IT", "Italy", "Europe", "EUR", ["Autumn", "Spring"], ["direct_portal", "external_service"], 1, 0),
  c("FR", "France", "Europe", "EUR", ["Autumn"], ["centralized_portal", "direct_portal"], 1, 0),
  c("NL", "Netherlands", "Europe", "EUR", ["September", "February"], ["centralized_portal", "direct_portal"], 1, 1),
  c("GB", "United Kingdom", "Europe", "GBP", ["September", "January"], ["centralized_portal", "direct_portal"], 1, 0),
  c("US", "United States", "North America", "USD", ["Fall", "Spring"], ["direct_portal", "external_service"], 1, 0),
  c("AU", "Australia", "Oceania", "AUD", ["Semester 1", "Semester 2"], ["direct_portal"], 1, 0),
  c("SE", "Sweden", "Europe", "SEK", ["Autumn"], ["centralized_portal"], 1, 1),
  c("FI", "Finland", "Europe", "EUR", ["Autumn"], ["centralized_portal"], 1, 0),
  c("HU", "Hungary", "Europe", "HUF", ["Autumn", "Spring"], ["direct_portal"], 1, 0),
  c("RO", "Romania", "Europe", "RON", ["Autumn"], ["direct_portal", "email"], 1, 0),
  c("CZ", "Czech Republic", "Europe", "CZK", ["Autumn"], ["direct_portal"], 1, 0),
];

export const countryName = (code: string) => countries.find((x) => x.code === code)?.name ?? code;
