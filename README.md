# SplitCab India 🇮🇳 - Smart On-Demand Cab Pooling & Fare Halver

> **The Problem:** In Indian metropolitan hubs (Bangalore, Delhi-NCR, Mumbai, Hyderabad, Pune), two commuters living in the same 1 km neighborhood often travel along the exact same IT corridors or airport expressways, yet each pays ₹500–₹800 for solo cabs while worsening traffic congestion.
>
> **The Solution:** A geospatial peer-to-peer matchmaking platform tailored for India that matches verified commuters within a **strict 1.0 km radius**, splits fares **proportionally by distance traveled**, validates identities via **UIDAI Aadhaar e-KYC**, and benchmarks market rates via **TinyFish AI Web Agents**.

---

## 🌟 Complete Feature Breakdown

| Feature | Implementation Details |
| :--- | :--- |
| **Real-Time Map** | Real street-level OpenStreetMap tiles via **Leaflet.js**, glowing route polylines, waypoint flags, and 60fps moving cab animation. |
| **INR (₹) Currency** | All fares, per-km rates, savings, and calculators converted to Indian Rupees (₹). |
| **Aadhaar e-KYC Authentication** | Integrated UIDAI verification modal with 12-digit Aadhaar input, OTP request simulation, and green `[UIDAI Verified ✓]` security badge. |
| **TinyFish API Web Agent** | Live AI web agent modal with API key configuration and simulated cloud Chromium scraper benchmarking rates against Uber Go, Ola Mini, and Rapido. |
| **Proportional Distance-Based Split** | Replaces arbitrary 50-50 splits with fair distance math: $\text{Share}_A = \text{Total Fare} \times \frac{D_A}{D_A + D_B}$. |
| **Strict 1.0 km Proximity Radius** | Only pairs riders whose pickups are within a 1,000-meter radius, visually rendered as a glowing geofence circle on the map. |
| **Vehicle Types** | 🛺 Shared Auto (₹8.5/km), 🚗 Mini Hatchback (₹12/km), 🚘 Prime Sedan (₹15.5/km), and 🚙 SUV XL (₹22/km). |
| **College & Office Communities** | Closed trust circles (Infosys Tech Hub, BITS Pilani / IIT Campus, Google/Microsoft, Deloitte) with community-exclusive matching filter. |
| **Women-Preferred Ride Matching** | Pink Shield `[🛡️👩 Women-Only Pool]` toggle filter strictly matching verified female commuters. |
| **Smart Savings Calculator** | Interactive slider calculator computing daily, monthly (₹11,000+), and yearly (₹1,32,000+) cash savings + CO₂ emissions offset. |
| **Scheduled Rides** | `⚡ Ride Now` vs `📅 Schedule Ride` mode with date picker and peak rush hour slots (08:30 AM Office Rush, 06:00 PM Evening Return). |
| **Smart Route Matching** | Multi-stop waypoint itinerary optimizer: `Stop 1 (Pickup A) ➔ Stop 2 (Pickup B) ➔ Stop 3 (Drop B) ➔ Stop 4 (Drop A)`. |
| **Traffic-Aware Prediction** | Live traffic conditions (Clear 1.0x, Moderate Rush 1.25x, Peak Jam 1.55x) with dynamic detour and arrival estimation. |

---

## 🚀 Quick Launch

Open `index.html` in your browser:
```powershell
Start-Process "c:\Users\tooba\Downloads\splitcab-prototype\index.html"
```
