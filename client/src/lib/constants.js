export const PAYERS = [
    "Bride & Groom",
    "Bride's Parents",
    "Groom's Parents",
    "Other"
]

export const CATEGORIES = [
    "Venue",
    "Catering",
    "Photography",
    "Videography",
    "Florals & Decor",
    "Music & Entertainment",
    "Attire & Beauty",
    "Invitations & Stationery",
    "Transportation",
    "Officiant",
    "Rings & Jewlery",
    "Honeymoon",
    "Miscellaneous"
]

export const STATUS_CONFIG = {
    pending: {label: "Pending", color: "#c9a96e"},
    deposited: {label: "Deposit Paid", color: "#7ba7bc"},
    paid: {label: "Paid in Full", color: "#7caf8a"},
    cancelled: {label: "Cancelled", color: "#c47b7b"}
}

export function formatCurrency (val) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
    }).format(val || 0)
}