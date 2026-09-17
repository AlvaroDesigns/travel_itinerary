import { Activity } from "@/context/TravelContext";
import { getNextDateStr } from "./date";

// Activities for a selected day (including check-out reminders for accommodations)
export const getDayActivities = (
  activities: Activity[] | undefined,
  activeDate: string
): Activity[] => {
  const dayActivities: Activity[] = [];
  if (!activities || !activeDate) return dayActivities;

  activities.forEach((act) => {
    if (act.date === activeDate) {
      dayActivities.push(act);
    }
    if (act.type === "hotel") {
      let checkoutDay = act.checkoutDate ? act.checkoutDate.trim() : "";
      if (!checkoutDay || checkoutDay === act.date) {
        checkoutDay = getNextDateStr(act.date);
      }
      if (
        checkoutDay &&
        checkoutDay !== act.date &&
        checkoutDay === activeDate
      ) {
        dayActivities.push({
          ...act,
          id: `${act.id}-checkout`,
          originalId: act.id,
          isCheckout: true,
          date: checkoutDay,
          time: act.checkOut || "11:00",
          price: 0,
        });
      }
    }
  });

  dayActivities.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  return dayActivities;
};
