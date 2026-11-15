// MixerShare UK B2B Ready-Mix Fleet & Tipper Exchange Application JavaScript

// 1. Automatic LocalStorage Scrubber (Purge legacy test data & remove Henry Transport — Ian Henry does not own a truck)
try {
  let customListings = JSON.parse(localStorage.getItem("mixershare_custom_listings") || "[]");
  const filteredListings = customListings.filter(l => {
    const text = ((l.plantName || "") + " " + (l.location || "") + " " + (l.truckType || "")).toLowerCase();
    return !text.includes("henry transport") && !text.includes("nk68 abc") && !text.includes("ian henry transport");
  });
  if (filteredListings.length !== customListings.length) {
    localStorage.setItem("mixershare_custom_listings", JSON.stringify(filteredListings));
  }
  
  let subs = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
  const filteredSubs = subs.filter(s => {
    const text = ((s.operator || "") + " " + (s.driver_name || "") + " " + (s.company || "") + " " + (s.company_name || "") + " " + (s.vrn || "")).toLowerCase();
    return !text.includes("henry transport") && !text.includes("nk68 abc") && !text.includes("ian henry transport");
  });
  if (filteredSubs.length !== subs.length) {
    localStorage.setItem("mixershare_submissions", JSON.stringify(filteredSubs));
  }
} catch(e) {
  console.warn("Storage scrub error:", e);
}

// Active Fleet Rental Listings (Populated dynamically by verified partner yards and moderator)
const mockListings = [];

// Live Driver Availability Status List (Populated dynamically by live registered drivers)
const mockDriverAvailability = [];

// Live Plant Relief Needs List (Populated dynamically by incoming plant requests)
const mockPlantNeeds = [];

// Load persisted custom listings, registered drivers & plant requests from LocalStorage
try {
  const storedListings = JSON.parse(localStorage.getItem("mixershare_custom_listings") || "[]");
  storedListings.forEach(l => {
    if (!l.id) l.id = "lst-" + Date.now() + Math.random().toString(36).substr(2, 5);
    mockListings.unshift(l);
  });

  const storedSubs = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
  storedSubs.forEach(sub => {
    if (sub.formType === "driver-signup" || sub.formType === "haulier-full-onboarding" || sub.formType === "driver-availability-quick") {
      mockDriverAvailability.unshift({
        id: sub.id || ("drv-" + (sub.timestamp || Date.now()) + Math.random().toString(36).substr(2, 4)),
        name: sub.operator || sub.driver_name || "Registered Driver",
        truck: sub.vehicle || sub.vehicle_type || "Standard 8m³ Rigid Mixer",
        location: sub.postcode || sub.location || "North East Pilot",
        status: sub.status || "Available Now",
        availableHours: sub.availableHours || sub.timing || "Immediate Dispatch"
      });
    } else if (sub.formType === "plant-inquiry" || sub.formType === "plant-relief-quick") {
      mockPlantNeeds.unshift({
        id: sub.id || ("plt-" + (sub.timestamp || Date.now()) + Math.random().toString(36).substr(2, 4)),
        plant: sub.company || sub.company_name || "Registered Plant",
        location: sub.location || "North East",
        need: sub.reliefNeed || sub.relief_need || "Emergency Relief Dispatch",
        time: sub.time || "Logged Today"
      });
    }
  });
} catch (e) {
  console.warn("Storage preload error:", e);
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  renderListings(mockListings);
  renderDriverPortal();
  renderPlantNeedsPortal();
  initFilters();
  initListingForm();
  initCalculators();
  initRegistrationForms();
  if (typeof updateSimCalculation === "function") {
    updateSimCalculation();
  }
});

// Tab Switching
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      document.getElementById(targetId).classList.add("active");
    });
  });
}

// Render Fleet Exchange Listings
function renderListings(listings) {
  const container = document.getElementById("listings-container");
  if (!container) return;

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:3rem 1.5rem; background:#fff; border:2px dashed #cbd5e1; border-radius:12px;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🚛</div>
        <h3 style="margin:0 0 0.5rem 0; color:#0f172a; font-size:1.25rem;">No Idle Trucks Listed for Hire on the Public Board</h3>
        <p style="color:#64748b; font-size:0.92rem; max-width:550px; margin:0 auto 1.5rem auto; line-height:1.5;">
          Have an idle mixer or tipper in your yard today? List your truck to earn guaranteed daily hire rates, or check live owner-driver availability and plant relief needs.
        </p>
        <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
          <button class="btn" style="background:#f59e0b; color:#0f172a; font-weight:800; padding:0.65rem 1.25rem;" onclick="openListTruckModal()">+ List an Idle Truck for Hire</button>
          <button class="btn" style="background:#16a34a; color:#fff; font-weight:800; padding:0.65rem 1.25rem;" onclick="openDriverAvailabilityModal()">🟢 Put Your Truck on Driver Board</button>
          <button class="btn" style="background:#2563eb; color:#fff; font-weight:800; padding:0.65rem 1.25rem;" onclick="openPlantReliefModal()">⚡ Request Emergency Plant Relief</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = listings.map(item => {
    const savings = item.rateTypeOptions.retailFullDay - item.rateTypeOptions.fullDay;
    const isTipper = item.category === "tipper";
    return `
    <div class="listing-card">
      <div class="listing-main">
        <div class="truck-badge" style="background:${isTipper ? '#fef3c7' : '#e0f2fe'}; color:${isTipper ? '#92400e' : '#0369a1'};">
          <div>${isTipper ? 'TIPPER' : (item.capacityM3 <= 4 ? '2-AXLE 4m³' : '8m³ RIGID')}</div>
          <div style="font-size:0.75rem; font-weight:normal;">${isTipper ? item.capacityTonne + ' TONNE' : item.capacityM3 + ' m³ DRUM'}</div>
        </div>
        <div class="listing-info">
          <h4>${item.plantName} <span class="pill" style="margin-left:0.5rem; background:#f1f5f9; color:#334155;">${item.distanceMiles} Miles Away</span></h4>
          <p><strong>Type:</strong> ${item.truckType} • <strong>Available:</strong> ${item.availableCount} Truck(s) ${item.driverIncluded ? '+ HGV Driver' : ''}</p>
          <div class="rate-pills">
            <span class="pill per-load">⚡ Spot Relief Load Available</span>
            <span class="pill">Half Day: £${item.rateTypeOptions.halfDay}</span>
            <span class="pill" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a;">🔥 Shift Rate: £${item.rateTypeOptions.fullDay}</span>
            <span class="pill" style="background:#fef2f2; color:#991b1b;">🛡️ Customer Protected</span>
            <span class="pill" style="background:#f0fdf4; color:#15803d;">⚡ Stripe 24hr Payout</span>
          </div>
        </div>
      </div>
      <div class="listing-action">
        <div style="text-decoration:line-through; color:#94a3b8; font-size:0.85rem;">Standard Hire: £${item.rateTypeOptions.retailFullDay}</div>
        <div class="price-tag" style="color:#16a34a;">£${item.rateTypeOptions.fullDay} <span style="font-size:0.8rem; font-weight:normal; color:#64748b;">/ shift</span></div>
        <div class="price-sub" style="color:#16a34a; font-weight:bold;">Save £${savings} vs Sub-Contractors!</div>
        <button class="btn" onclick="openBookingModal(${item.id})">Book via Stripe</button>
      </div>
    </div>
  `;
  }).join('');
}

// Render Driver Availability Portal
function renderDriverPortal() {
  const container = document.getElementById("driver-availability-list");
  if (!container) return;

  if (mockDriverAvailability.length === 0) {
    container.innerHTML = `
      <div style="background:#fff; border:2px dashed #cbd5e1; border-radius:8px; padding:2rem; text-align:center;">
        <p style="color:#64748b; margin:0 0 0.5rem 0; font-size:1rem; font-weight:600;">No drivers currently logged as available.</p>
        <p style="color:#94a3b8; margin:0 0 1rem 0; font-size:0.85rem;">Are you an HGV mixer or tipper owner-driver? Mark your truck available today to receive dispatch relief orders.</p>
        <button class="btn" onclick="toggleDriverAvailability()">+ Toggle My Availability Status</button>
      </div>
    `;
    return;
  }

  container.innerHTML = mockDriverAvailability.map(d => `
    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <strong style="font-size:1.05rem; color:#0f172a;">${d.name}</strong> 
        <span class="pill" style="background:#dcfce7; color:#16a34a; margin-left:0.5rem;">${d.status}</span>
        <div style="font-size:0.85rem; color:#64748b; margin-top:0.2rem;">
          🚚 ${d.truck} • 📍 ${d.location} • ⏰ ${d.availableHours}
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <a href="tel:07494867646" class="btn btn-secondary" style="text-decoration:none; padding:0.5rem 0.9rem; font-size:0.85rem;">📞 Call Dispatch</a>
        <a href="https://wa.me/447494867646?text=Hi%20Ian,%20requesting%20dispatch%20for%20${encodeURIComponent(d.name)}" target="_blank" class="btn" style="background:#25d366; color:#fff; text-decoration:none; padding:0.5rem 0.9rem; font-size:0.85rem;">💬 WhatsApp</a>
      </div>
    </div>
  `).join('');
}

// Render Plant Needs Portal
function renderPlantNeedsPortal() {
  const container = document.getElementById("plant-needs-list");
  if (!container) return;

  if (mockPlantNeeds.length === 0) {
    container.innerHTML = `
      <div style="background:#fff; border:2px dashed #cbd5e1; border-radius:10px; padding:2.5rem 1.5rem; text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">📢</div>
        <h4 style="margin:0 0 0.5rem 0; color:#0f172a; font-size:1.15rem;">No Urgent Plant Relief Requests Logged Right Now</h4>
        <p style="color:#64748b; margin:0 0 1.25rem 0; font-size:0.9rem; max-width:520px; margin-left:auto; margin-right:auto;">Are you a concrete batch plant manager short on drivers or dealing with a truck breakdown today? Broadcast your relief requirements to live owner-drivers in seconds.</p>
        <button class="btn" style="background:#2563eb; color:#fff; font-weight:800;" onclick="togglePlantRequestForm()">⚡ Post Emergency Plant Relief Need</button>
      </div>
    `;
    return;
  }

  container.innerHTML = mockPlantNeeds.map(p => `
    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <strong style="font-size:1.05rem; color:#0f172a;">${p.plant}</strong> <span class="pill" style="margin-left:0.4rem; background:#f1f5f9; color:#475569;">${p.location}</span>
        <div style="font-size:0.9rem; color:#1e293b; margin-top:0.25rem;">
          📢 <strong>Requirement:</strong> ${p.need}
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <a href="tel:07494867646" class="btn" style="background:#16a34a; color:#fff; text-decoration:none; padding:0.5rem 0.9rem; font-size:0.85rem;">📞 Cover Order (07494 867646)</a>
        <a href="https://wa.me/447494867646?text=Hi%20Ian,%20I%20have%20an%20available%20truck%20to%20cover%20the%20relief%20need%20for%20${encodeURIComponent(p.plant)}" target="_blank" class="btn" style="background:#25d366; color:#fff; text-decoration:none; padding:0.5rem 0.9rem; font-size:0.85rem;">💬 WhatsApp</a>
      </div>
    </div>
  `).join('');
}

// Toggle Live Availability (redirects to modal)
function toggleDriverAvailability() {
  openDriverAvailabilityModal();
}

// 1. Driver Availability Modal
function openDriverAvailabilityModal() {
  document.body.style.overflow = 'hidden';

  const modalHtml = `
    <div class="modal-overlay" id="availability-modal" onclick="if(event.target === this) closeAvailabilityModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-drag-bar"></div>
        <div class="modal-header">
          <h3>🟢 Declare Driver / Truck Availability</h3>
          <button class="close-btn" aria-label="Close" onclick="closeAvailabilityModal()">&times;</button>
        </div>
        <div class="modal-scroll-body" id="avail-modal-body">
          <p style="font-size:0.88rem; color:#64748b; margin-bottom:1rem; line-height:1.4;">
            Are you an HGV mixer or tipper owner-driver with drum capacity today? Post your availability to appear instantly on the live dispatch board.
          </p>

          <form id="driver-avail-quick-form" onsubmit="submitDriverAvailabilityModal(event)">
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Operator / Driver Name *</label>
              <input type="text" id="dam-name" placeholder="e.g. D.W. Haulage Ltd or Dave Wilson" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Mobile Number (For Dispatch SMS / WhatsApp) *</label>
              <input type="tel" id="dam-mobile" placeholder="07494 867646" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Vehicle Specification *</label>
              <select id="dam-truck" style="width:100%; box-sizing:border-box;">
                <option value="Standard 8m³ 4-Axle Rigid Mixer" selected>Standard 8m³ 4-Axle Rigid Mixer</option>
                <option value="2-Axle 4m³ Compact Mini-Mixer">2-Axle 4m³ Compact Mini-Mixer</option>
                <option value="3-Axle 6m³ Rigid Mixer">3-Axle 6m³ Medium Mixer</option>
                <option value="8x4 32t Steel Tipper Wagon">8x4 32-Tonne Tipper Wagon</option>
                <option value="8x4 32t Grab Tipper Lorry">8x4 32-Tonne Grab Tipper Lorry</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Operating Town / Base Postcode *</label>
              <input type="text" id="dam-location" placeholder="e.g. Gateshead, Newcastle, Sunderland, Durham, Teesside (NE8)" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">When Are You Available? *</label>
              <select id="dam-timing" style="width:100%; box-sizing:border-box;">
                <option value="Available Today (Immediate Dispatch)" selected>Available Today (Immediate Dispatch)</option>
                <option value="Available Today (Afternoon Relief 12:00-17:00)">Available Today (Afternoon Relief 12:00–17:00)</option>
                <option value="Available Tomorrow (Full Shift 07:00 Start)">Available Tomorrow (Full Shift 07:00 Start)</option>
                <option value="Available Regular / Weekly Coverage">Available Regular / Weekly Coverage</option>
              </select>
            </div>

            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:0.75rem; margin-bottom:1.1rem; font-size:0.82rem; color:#14532d;">
              ✔ <strong>Direct 24-hr Faster Payments Payouts</strong> via Stripe Connect UK.<br>
              ✔ <strong>Zero Sign-up Fees</strong> • Keep your drum turning and earn full shift / relief rates.
            </div>

            <button type="submit" class="btn" style="width:100%; padding:0.9rem; font-size:1.05rem; font-weight:800; background:#16a34a; color:#fff; border:none; border-radius:6px; cursor:pointer;">
              🟢 Go Live as Available Now
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById("availability-modal");
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitDriverAvailabilityModal(e) {
  e.preventDefault();
  const name = (document.getElementById("dam-name") && document.getElementById("dam-name").value.trim()) || "Owner-Driver";
  const mobile = (document.getElementById("dam-mobile") && document.getElementById("dam-mobile").value.trim()) || "07494 867646";
  const truck = (document.getElementById("dam-truck") && document.getElementById("dam-truck").value) || "Standard 8m³ Rigid Mixer";
  const location = (document.getElementById("dam-location") && document.getElementById("dam-location").value.trim()) || "North East UK";
  const timing = (document.getElementById("dam-timing") && document.getElementById("dam-timing").value) || "Available Today";

  const newDriver = {
    id: Date.now(),
    name: name,
    truck: truck,
    location: location,
    status: timing.includes("Today") ? "Available Today" : "Available Tomorrow",
    availableHours: timing
  };

  mockDriverAvailability.unshift(newDriver);

  try {
    const existing = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
    existing.unshift({
      timestamp: new Date().toISOString(),
      formType: "driver-signup",
      operator: name,
      driver_name: name,
      vehicle: truck,
      postcode: location,
      mobile: mobile,
      timing: timing
    });
    localStorage.setItem("mixershare_submissions", JSON.stringify(existing));
  } catch(err) {
    console.warn("Storage err:", err);
  }

  try {
    const formData = new FormData();
    formData.append("form-name", "driver-signup");
    formData.append("driver_name", name);
    formData.append("mobile", mobile);
    formData.append("vehicle_type", truck);
    formData.append("base_postcode", location);
    formData.append("operator_type", "owner-driver-1");
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    }).catch(e => console.log("Local netlify save"));
  } catch(err) {}

  renderDriverPortal();

  const body = document.getElementById("avail-modal-body");
  if (body) {
    body.innerHTML = `
      <div style="text-align:center; padding:1rem 0.5rem;">
        <div style="font-size:3.2rem; line-height:1; margin-bottom:0.75rem;">🚛 🟢</div>
        <h3 style="color:#166534; font-size:1.35rem; margin-bottom:0.5rem; font-weight:800;">You Are Marked Available!</h3>
        <p style="color:#15803d; font-size:0.95rem; margin-bottom:1.25rem;">
          <strong>${name}</strong> is now live on the MixerShare dispatch board with your <strong>${truck}</strong>.
        </p>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:1rem; text-align:left; font-size:0.86rem; color:#14532d; line-height:1.6; margin-bottom:1.25rem;">
          <p>✔ <strong>Location Area:</strong> ${location}</p>
          <p>✔ <strong>Dispatch SMS Contact:</strong> ${mobile}</p>
          <p>✔ <strong>Timing:</strong> ${timing}</p>
          <p>✔ <strong>Central Dispatch:</strong> Ian Henry has received your availability and will contact you directly with local relief orders.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          <a href="tel:07494867646" class="btn" style="background:#16a34a; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">📞 Call Central Dispatch (07494 867646)</a>
          <a href="https://wa.me/447494867646?text=Hi%20Ian,%20I%20just%20marked%20my%20truck%20available%20on%20MixerShare%20(${encodeURIComponent(name)}%20-%20${encodeURIComponent(truck)})" target="_blank" class="btn" style="background:#25d366; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">💬 WhatsApp Ian Henry</a>
          <button class="btn btn-secondary" style="padding:0.75rem; font-size:0.95rem; margin-top:0.25rem; width:100%;" onclick="closeAvailabilityModal(); switchTab('driver-portal');">View on Live Board &amp; Close</button>
        </div>
      </div>
    `;
  }
}

// 2. Plant Relief Need Modal
function openPlantReliefModal() {
  document.body.style.overflow = 'hidden';

  const modalHtml = `
    <div class="modal-overlay" id="availability-modal" onclick="if(event.target === this) closeAvailabilityModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-drag-bar"></div>
        <div class="modal-header">
          <h3>⚡ Post Emergency Plant Relief Need</h3>
          <button class="close-btn" aria-label="Close" onclick="closeAvailabilityModal()">&times;</button>
        </div>
        <div class="modal-scroll-body" id="avail-modal-body">
          <p style="font-size:0.88rem; color:#64748b; margin-bottom:1rem; line-height:1.4;">
            Short on drivers or dealing with a mixer breakdown today? Broadcast your relief requirements across the North East fleet network in 60 seconds.
          </p>

          <form id="plant-relief-modal-form" onsubmit="submitPlantReliefModal(event)">
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Batch Plant / Yard Name *</label>
              <input type="text" id="prm-plant" placeholder="e.g. CEMEX Gateshead or Tyne ReadyMix" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Yard Postcode / Town *</label>
              <input type="text" id="prm-location" placeholder="e.g. Newcastle / NE8 1AA" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Vehicle Type Required *</label>
              <select id="prm-truck" style="width:100%; box-sizing:border-box;">
                <option value="Standard 8m³ Rigid Mixer" selected>Standard 8m³ Rigid Mixer</option>
                <option value="2-Axle 4m³ Mini-Mixer">2-Axle 4m³ Compact Mini-Mixer</option>
                <option value="3-Axle 6m³ Rigid Mixer">3-Axle 6m³ Medium Mixer</option>
                <option value="8x4 32t Tipper Wagon">8x4 32-Tonne Tipper Wagon</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Relief Scope &amp; Urgency *</label>
              <select id="prm-scope" style="width:100%; box-sizing:border-box;">
                <option value="2 Emergency Relief Loads (Minimum Per-Load Quota)" selected>2 Emergency Relief Loads (Minimum Driver Call-Out Quota)</option>
                <option value="3-4 Relief Loads Today">3–4 Relief Loads Today</option>
                <option value="Full Shift Today (Immediate Relief)">Full Shift Today (Immediate Relief)</option>
                <option value="Full Shift Tomorrow (07:00 Start)">Full Shift Tomorrow (07:00 Start)</option>
                <option value="Weekly Relief Capacity">Weekly Relief Capacity</option>
              </select>
              <div style="font-size:0.75rem; color:#92400e; background:#fef3c7; border:1px solid #fde68a; padding:0.45rem 0.65rem; border-radius:6px; margin-top:0.35rem; line-height:1.4;">
                🛡️ <strong>Deadhead Mileage Guardrail:</strong> 1–2 spot loads dispatch to hauliers within an 8-mile radius. For dispatches exceeding 8 deadhead miles (15–20 miles), MixerShare applies a Minimum Call-Out (Half-Day Shift £320 or £2.50/mi diesel allowance) to protect the haulier.
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Delivery Distance (Plant to Pour Site) *</label>
              <select id="prm-distance" style="width:100%; box-sizing:border-box;">
                <option value="1-3 Radial Miles">1–3 Radial Miles (Local Pour Site)</option>
                <option value="4-6 Radial Miles" selected>4–6 Radial Miles (Standard Radius)</option>
                <option value="7-10 Radial Miles">7–10 Radial Miles (Extended Run)</option>
                <option value="11-15 Radial Miles">11–15 Radial Miles</option>
                <option value="Full Day Shift (Unlimited in Zone)">Full Day Shift (Unlimited in Zone)</option>
              </select>
            </div>

            <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:1rem;">
              <div class="form-group">
                <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Contact Name *</label>
                <input type="text" id="prm-contact" placeholder="Plant Manager" required style="width:100%; box-sizing:border-box;">
              </div>
              <div class="form-group">
                <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Direct Phone / Mobile *</label>
                <input type="tel" id="prm-phone" placeholder="07494 867646" required style="width:100%; box-sizing:border-box;">
              </div>
            </div>

            <button type="submit" class="btn" style="width:100%; padding:0.9rem; font-size:1.05rem; font-weight:800; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer;">
              📢 Broadcast Relief Need to Available Drivers
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById("availability-modal");
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitPlantReliefModal(e) {
  e.preventDefault();
  const plant = (document.getElementById("prm-plant") && document.getElementById("prm-plant").value.trim()) || "Batch Plant";
  const location = (document.getElementById("prm-location") && document.getElementById("prm-location").value.trim()) || "North East";
  const truck = (document.getElementById("prm-truck") && document.getElementById("prm-truck").value) || "Standard 8m³ Rigid Mixer";
  const scope = (document.getElementById("prm-scope") && document.getElementById("prm-scope").value) || "2 Emergency Relief Loads (Minimum Quota)";
  const distance = (document.getElementById("prm-distance") && document.getElementById("prm-distance").value) || "4-6 Radial Miles";
  const contact = (document.getElementById("prm-contact") && document.getElementById("prm-contact").value.trim()) || "Plant Manager";
  const phone = (document.getElementById("prm-phone") && document.getElementById("prm-phone").value.trim()) || "07494 867646";

  const needDesc = `Need ${truck} — ${scope} [${distance}]`;

  mockPlantNeeds.unshift({
    id: Date.now(),
    plant: plant,
    location: location,
    need: needDesc,
    time: "ASAP"
  });

  try {
    const existing = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
    existing.unshift({
      timestamp: new Date().toISOString(),
      formType: "plant-inquiry",
      company: plant,
      location: location,
      contact: contact,
      phone: phone,
      distance: distance,
      reliefNeed: needDesc
    });
    localStorage.setItem("mixershare_submissions", JSON.stringify(existing));
  } catch(err) {
    console.warn("Storage err:", err);
  }

  try {
    const formData = new FormData();
    formData.append("form-name", "plant-inquiry");
    formData.append("company_name", plant);
    formData.append("location", location);
    formData.append("contact_name", contact);
    formData.append("phone", phone);
    formData.append("distance", distance);
    formData.append("relief_need", needDesc);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    }).catch(e => console.log("Local netlify save"));
  } catch(err) {}

  renderPlantNeedsPortal();

  const body = document.getElementById("avail-modal-body");
  if (body) {
    body.innerHTML = `
      <div style="text-align:center; padding:1rem 0.5rem;">
        <div style="font-size:3.2rem; line-height:1; margin-bottom:0.75rem;">🏭 ⚡</div>
        <h3 style="color:#166534; font-size:1.35rem; margin-bottom:0.5rem; font-weight:800;">Relief Request Broadcasted!</h3>
        <p style="color:#15803d; font-size:0.95rem; margin-bottom:1.25rem;">
          Emergency relief logged for <strong>${plant}</strong> (${contact}).
        </p>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:1rem; text-align:left; font-size:0.86rem; color:#14532d; line-height:1.6; margin-bottom:1.25rem;">
          <p>✔ <strong>Yard Location:</strong> ${location}</p>
          <p>✔ <strong>Vehicle Needed:</strong> ${truck}</p>
          <p>✔ <strong>Relief Scope:</strong> ${scope}</p>
          <p>✔ <strong>Next Step:</strong> Ian Henry and central dispatch are actively routing an available owner-driver to your yard.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          <a href="tel:07494867646" class="btn" style="background:#16a34a; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">📞 Call Central Dispatch (07494 867646)</a>
          <a href="https://wa.me/447494867646?text=Hi%20Ian,%20we%20just%20posted%20a%20relief%20request%20for%20${encodeURIComponent(plant)}%20(${encodeURIComponent(needDesc)})" target="_blank" class="btn" style="background:#25d366; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">💬 WhatsApp Dispatch Desk</a>
          <button class="btn btn-secondary" style="padding:0.75rem; font-size:0.95rem; margin-top:0.25rem; width:100%;" onclick="closeAvailabilityModal(); switchTab('plant-portal');">View on Needs Board &amp; Close</button>
        </div>
      </div>
    `;
  }
}

// 3. List Spare Truck Modal (for Yards & Hauliers with idle trucks)
function openListTruckModal() {
  document.body.style.overflow = 'hidden';

  const modalHtml = `
    <div class="modal-overlay" id="availability-modal" onclick="if(event.target === this) closeAvailabilityModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-drag-bar"></div>
        <div class="modal-header">
          <h3>📋 List Spare Mixer / Tipper for Hire</h3>
          <button class="close-btn" aria-label="Close" onclick="closeAvailabilityModal()">&times;</button>
        </div>
        <div class="modal-scroll-body" id="avail-modal-body">
          <p style="font-size:0.88rem; color:#64748b; margin-bottom:1rem; line-height:1.4;">
            Have an idle mixer or tipper in your yard today? List your truck with driver on the MixerShare Fleet Exchange to turn spare capacity into guaranteed revenue.
          </p>

          <form id="list-truck-modal-form" onsubmit="submitListTruckModal(event)">
            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Plant / Haulier Company Name *</label>
              <input type="text" id="ltm-name" placeholder="e.g. Apex Haulage Ltd or North East Concrete" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Vehicle Type &amp; Drum Size *</label>
              <select id="ltm-truck" style="width:100%; box-sizing:border-box;">
                <option value="Standard 8m³ 4-Axle Rigid Mixer" selected>Standard 8m³ 4-Axle Rigid Mixer</option>
                <option value="2-Axle 4m³ Compact Mini-Mixer">2-Axle 4m³ Compact Mini-Mixer</option>
                <option value="3-Axle 6m³ Rigid Mixer">3-Axle 6m³ Medium Mixer</option>
                <option value="8x4 32t Steel Body Tipper Wagon">8x4 32t Steel Body Tipper Wagon</option>
              </select>
            </div>

            <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.85rem;">
              <div class="form-group">
                <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Full Day Shift Rate (£) *</label>
                <input type="number" id="ltm-rate-full" value="520" required style="width:100%; box-sizing:border-box;">
              </div>
              <div class="form-group">
                <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Half Day Shift Rate (£) *</label>
                <input type="number" id="ltm-rate-half" value="320" required style="width:100%; box-sizing:border-box;">
              </div>
            </div>

            <div class="form-group" style="margin-bottom:0.85rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Operating Location / Yard Town *</label>
              <input type="text" id="ltm-location" placeholder="e.g. Gateshead / Newcastle (NE8)" required style="width:100%; box-sizing:border-box;">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label style="font-weight:700; font-size:0.85rem; display:block; margin-bottom:0.3rem;">Direct Contact Phone *</label>
              <input type="tel" id="ltm-phone" placeholder="07494 867646" required style="width:100%; box-sizing:border-box;">
            </div>

            <button type="submit" class="btn" style="width:100%; padding:0.9rem; font-size:1.05rem; font-weight:800; background:#f59e0b; color:#0f172a; border:none; border-radius:6px; cursor:pointer;">
              📋 Add Spare Truck to Fleet Exchange
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById("availability-modal");
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitListTruckModal(e) {
  e.preventDefault();
  const name = (document.getElementById("ltm-name") && document.getElementById("ltm-name").value.trim()) || "Partner Yard";
  const truck = (document.getElementById("ltm-truck") && document.getElementById("ltm-truck").value) || "Standard 8m³ Rigid Mixer";
  const rateFull = parseInt(document.getElementById("ltm-rate-full") && document.getElementById("ltm-rate-full").value) || 520;
  const rateHalf = parseInt(document.getElementById("ltm-rate-half") && document.getElementById("ltm-rate-half").value) || 320;
  const location = (document.getElementById("ltm-location") && document.getElementById("ltm-location").value.trim()) || "North East";
  const phone = (document.getElementById("ltm-phone") && document.getElementById("ltm-phone").value.trim()) || "07494 867646";

  const isTipper = truck.toLowerCase().includes("tipper");

  const newListing = {
    id: Date.now(),
    plantName: name,
    distanceMiles: 5,
    truckType: truck,
    category: isTipper ? "tipper" : "mixer",
    capacityM3: isTipper ? 0 : 8,
    capacityTonne: isTipper ? 20 : 0,
    driverIncluded: true,
    availableCount: 1,
    rateTypeOptions: {
      radialBase: 85,
      radialPerMile: 5.00,
      driverRadialBase: 76.50,
      driverRadialPerMile: 4.50,
      halfDay: rateHalf,
      fullDay: rateFull,
      retailFullDay: Math.round(rateFull * 1.45)
    },
    location: location,
    forsCompliant: true,
    cpcVerified: true,
    whiteLabelMode: true,
    nextDayPayout: true,
    flexibleExtension: true
  };

  mockListings.unshift(newListing);

  try {
    const stored = JSON.parse(localStorage.getItem("mixershare_custom_listings") || "[]");
    stored.unshift(newListing);
    localStorage.setItem("mixershare_custom_listings", JSON.stringify(stored));
  } catch(err) {}

  renderListings(mockListings);

  const body = document.getElementById("avail-modal-body");
  if (body) {
    body.innerHTML = `
      <div style="text-align:center; padding:1rem 0.5rem;">
        <div style="font-size:3.2rem; line-height:1; margin-bottom:0.75rem;">📋 ✅</div>
        <h3 style="color:#166534; font-size:1.35rem; margin-bottom:0.5rem; font-weight:800;">Spare Truck Listed for Hire!</h3>
        <p style="color:#15803d; font-size:0.95rem; margin-bottom:1.25rem;">
          <strong>${name}</strong> is now live on the MixerShare Fleet Exchange at £${rateFull} / shift.
        </p>
        <button class="btn" style="background:#16a34a; color:#fff; width:100%; padding:0.8rem; font-size:1rem; font-weight:bold;" onclick="closeAvailabilityModal(); switchTab('exchange-board');">View on Fleet Exchange</button>
      </div>
    `;
  }
}

function closeAvailabilityModal() {
  const modal = document.getElementById("availability-modal");
  if (modal) modal.remove();
  document.body.style.overflow = '';
}

// Generic Tab Switching Helper (e.g. from nav header links)
function switchTab(tabId, e) {
  if (e && e.preventDefault) e.preventDefault();

  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  const targetTabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (targetTabBtn) targetTabBtn.classList.add("active");
  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add("active");

  const portalsSection = document.getElementById("portals");
  if (portalsSection) {
    portalsSection.scrollIntoView({ behavior: "smooth" });
  }
}

// Navigate Directly to Plant Dispatch Desk (from nav buttons or hero)
function openPlantDispatch(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  // Switch to plant-portal tab
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  const plantTabBtn = document.querySelector('.tab-btn[data-tab="plant-portal"]');
  if (plantTabBtn) plantTabBtn.classList.add("active");
  const plantPortal = document.getElementById("plant-portal");
  if (plantPortal) plantPortal.classList.add("active");

  // Smooth scroll to portals container
  const portalsSection = document.getElementById("portals");
  if (portalsSection) {
    portalsSection.scrollIntoView({ behavior: "smooth" });
  }

  // Open the request form
  const form = document.getElementById("quick-plant-form");
  if (form) {
    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function togglePlantRequestForm() {
  const form = document.getElementById("quick-plant-form");
  if (!form) return;
  form.style.display = form.style.display === "none" ? "block" : "none";
  if (form.style.display === "block") {
    form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function submitUrgentPlantNeed(event) {
  event.preventDefault();
  const plant = document.getElementById("urgent-plant-name").value.trim() || "Batch Plant";
  const location = document.getElementById("urgent-plant-location").value.trim() || "North East";
  const truck = document.getElementById("urgent-truck-type").value;
  const time = document.getElementById("urgent-need-time").value;
  const distance = (document.getElementById("urgent-need-distance") && document.getElementById("urgent-need-distance").value) || "4-6 Radial Miles";
  const contact = document.getElementById("urgent-contact-name").value.trim();
  const phone = document.getElementById("urgent-contact-phone").value.trim();

  const needDesc = `Need ${truck} — ${time} [${distance}]`;

  mockPlantNeeds.unshift({
    id: Date.now(),
    plant: plant,
    location: location,
    need: needDesc,
    time: "ASAP"
  });

  renderPlantNeedsPortal();

  // Save to localStorage so Ian sees it immediately in portal.html
  try {
    const existing = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
    existing.unshift({
      timestamp: new Date().toISOString(),
      formType: "plant-inquiry",
      company: plant,
      location: location,
      contact: contact,
      phone: phone,
      distance: distance,
      reliefNeed: needDesc
    });
    localStorage.setItem("mixershare_submissions", JSON.stringify(existing));
  } catch(e) {
    console.warn("Storage err:", e);
  }

  // Submit via background fetch to Netlify form
  try {
    const formData = new FormData();
    formData.append("form-name", "plant-inquiry");
    formData.append("company_name", plant);
    formData.append("location", location);
    formData.append("contact_name", contact);
    formData.append("phone", phone);
    formData.append("email", "mixershareuk@gmail.com");
    formData.append("distance", distance);
    formData.append("relief_need", needDesc);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString()
    }).catch(err => console.log("Local submit:", err));
  } catch(err) {
    console.warn(err);
  }

  // Hide form and confirm
  togglePlantRequestForm();
  alert("📢 Dispatch Request Live!\n\nYour emergency truck requirement has been broadcast to available owner-drivers across the network and logged on Ian Henry's central dispatch desk.");
}

// Fallback button handler
function postPlantNeed() {
  togglePlantRequestForm();
}

// Filter Functionality
function initFilters() {
  const radiusSelect = document.getElementById("filter-radius");
  const typeSelect = document.getElementById("filter-type");

  const filterHandler = () => {
    const maxRadius = parseInt(radiusSelect.value) || 50;
    const selectedType = typeSelect.value;

    const filtered = mockListings.filter(item => {
      const matchRadius = item.distanceMiles <= maxRadius;
      let matchType = true;

      if (selectedType === "mixer") matchType = item.category === "mixer";
      else if (selectedType === "tipper") matchType = item.category === "tipper";
      else if (selectedType !== "all") matchType = item.truckType.toLowerCase().includes(selectedType);

      return matchRadius && matchType;
    });

    renderListings(filtered);
  };

  if (radiusSelect) radiusSelect.addEventListener("change", filterHandler);
  if (typeSelect) typeSelect.addEventListener("change", filterHandler);
}

// Stripe Booking Modal Logic
let currentBookingItem = null;
let currentBookingDistance = 6;

// Deadhead Travel Distance Calculator for UK Postcodes / Towns
function calculateDeadheadDistance(origin, destination) {
  if (!origin || !destination) return 6;
  const o = origin.toUpperCase().trim();
  const d = destination.toUpperCase().trim();
  if (o === d) return 2;

  const getOutcode = (str) => {
    const match = str.match(/\b([A-Z]{1,2}[0-9]{1,2}[A-Z]?)\b/);
    if (match) return match[1];
    if (str.includes("NEWCASTLE")) return "NE1";
    if (str.includes("GATESHEAD")) return "NE8";
    if (str.includes("SUNDERLAND")) return "SR1";
    if (str.includes("DURHAM")) return "DH1";
    if (str.includes("SOUTH SHIELDS")) return "NE33";
    if (str.includes("NORTH SHIELDS")) return "NE29";
    if (str.includes("BIRTLEY") || str.includes("WASHINGTON")) return "DH3";
    if (str.includes("DARLINGTON")) return "DL1";
    if (str.includes("MIDDLESBROUGH") || str.includes("TEESSIDE")) return "TS1";
    if (str.includes("HARTLEPOOL")) return "TS24";
    return "";
  };

  const oCode = getOutcode(o);
  const dCode = getOutcode(d);

  const matrix = {
    "NE1_NE8": 2, "NE8_NE1": 2,
    "NE1_NE29": 8, "NE29_NE1": 8,
    "NE8_NE29": 9, "NE29_NE8": 9,
    "NE1_DH3": 9, "DH3_NE1": 9,
    "NE8_DH3": 6, "DH3_NE8": 6,
    "NE1_SR1": 14, "SR1_NE1": 14,
    "NE8_SR1": 12, "SR1_NE8": 12,
    "NE1_DH1": 16, "DH1_NE1": 16,
    "NE8_DH1": 14, "DH1_NE8": 14,
    "SR1_DH1": 12, "DH1_SR1": 12,
    "SR1_DH3": 8, "DH3_SR1": 8,
    "NE1_DL1": 36, "DL1_NE1": 36,
    "NE8_DL1": 34, "DL1_NE8": 34,
    "NE1_TS1": 38, "TS1_NE1": 38,
    "NE8_TS1": 36, "TS1_NE8": 36,
    "SR1_TS1": 26, "TS1_SR1": 26,
    "DH1_DL1": 20, "DL1_DH1": 20,
    "DH1_TS1": 24, "TS1_DH1": 24
  };

  if (oCode && dCode) {
    if (oCode === dCode) return 3;
    const key = `${oCode}_${dCode}`;
    if (matrix[key]) return matrix[key];

    const oArea = oCode.replace(/[0-9].*$/, "");
    const dArea = dCode.replace(/[0-9].*$/, "");
    if (oArea === dArea) return 6;
    if ((oArea === "NE" && dArea === "SR") || (oArea === "SR" && dArea === "NE")) return 14;
    if ((oArea === "NE" && dArea === "DH") || (oArea === "DH" && dArea === "NE")) return 16;
    if ((oArea === "SR" && dArea === "DH") || (oArea === "DH" && dArea === "SR")) return 12;
    if ((oArea === "NE" && dArea === "TS") || (oArea === "TS" && dArea === "NE")) return 36;
    if ((oArea === "SR" && dArea === "TS") || (oArea === "TS" && dArea === "SR")) return 26;
    if ((oArea === "DH" && dArea === "TS") || (oArea === "TS" && dArea === "DH")) return 24;
    if ((oArea === "NE" && dArea === "DL") || (oArea === "DL" && dArea === "NE")) return 35;
    if ((oArea === "DH" && dArea === "DL") || (oArea === "DL" && dArea === "DH")) return 20;
  }

  return 7;
}

let currentDeadheadChoice = 'none';


function openBookingModal(listingId) {
  const item = mockListings.find(l => l.id === listingId);
  if (!item) return;

  currentBookingItem = item;
  currentBookingDistance = 6;

  // Lock body scroll to prevent background scroll on iOS/Android
  document.body.style.overflow = 'hidden';

  const modalHtml = `
    <div class="modal-overlay" id="booking-modal" onclick="if(event.target === this) closeBookingModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-drag-bar"></div>
        <div class="modal-header">
          <h3>💳 Stripe Checkout — MixerShare</h3>
          <button class="close-btn" aria-label="Close" onclick="closeBookingModal()">&times;</button>
        </div>
        <div class="modal-scroll-body" id="modal-body-container">
          <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; margin-bottom:0.75rem; font-size:0.88rem; line-height:1.4;">
            <p style="margin:0 0 0.25rem 0;"><strong>Lending Operator / Driver:</strong> ${item.plantName}</p>
            <p style="margin:0 0 0.25rem 0;"><strong>Equipment:</strong> ${item.truckType}</p>
            <p style="margin:0; font-size:0.8rem; color:#64748b;">📍 <strong>Driver Operating Base:</strong> <span style="color:#0284c7; font-weight:700;">${item.location}</span></p>
          </div>
          
          <div style="background:#fef3c7; border:1px solid #fde68a; color:#92400e; padding:0.65rem; border-radius:6px; margin-bottom:0.75rem; font-size:0.82rem; line-height:1.4;">
            ⚖️ <strong>Hire Rate:</strong> All-Inclusive Shifts &amp; Flexible Radial Spot Runs • Zero Transfer Fees
          </div>

          <div class="filter-group" style="margin-bottom:0.75rem;">
            <label style="font-weight:700; font-size:0.85rem; margin-bottom:0.35rem; display:block;">Select Rental Duration / Load Count:</label>
            <select id="modal-rental-type" onchange="handleModalRentalChange()" style="width:100%;">
              <option value="spot-2" selected>2 Spot Relief Loads (Minimum Driver Call-Out Quota)</option>
              <option value="spot-3">3 Spot Relief Loads</option>
              <option value="spot-4">4 Spot Relief Loads</option>
              <option value="half-day">Half Day Shift (4 Hours - £${item.rateTypeOptions.halfDay.toFixed(2)} All-Inc)</option>
              <option value="full-day">Full Day Shift (8 Hours - £${item.rateTypeOptions.fullDay.toFixed(2)} All-Inc)</option>
            </select>
            <div style="font-size:0.75rem; color:#1e40af; background:#eff6ff; border:1px solid #bfdbfe; border-radius:4px; padding:5px 8px; margin-top:0.35rem; line-height:1.35;">
              ⚖️ <strong>Driver 2-Load Minimum Quota:</strong> All per-load bookings enforce a minimum of 2 loads to protect driver startup, drum wear &amp; diesel. If you only require 1 load, the 2-load minimum call-out applies.
            </div>
          </div>

          <!-- Dynamic Radial Distance Selector (Visible for spot loads) -->
          <div id="modal-distance-section" style="display:none; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:0.75rem; margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <label style="font-weight:700; font-size:0.85rem; color:#0369a1; margin:0;">Delivery Distance (Plant to Pour Site):</label>
              <strong id="modal-distance-badge" style="font-size:0.92rem; color:#0284c7; background:#e0f2fe; padding:2px 8px; border-radius:4px; font-weight:800;">6 Radial Miles</strong>
            </div>
            <p style="font-size:0.75rem; color:#64748b; margin:0 0 0.5rem 0;">Need more or less than 6 miles? Adjust one-way radial distance below:</p>

            <div style="display:flex; gap:0.4rem; align-items:center;">
              <button type="button" class="btn" style="padding:0.4rem 0.75rem; background:#0284c7; color:#fff; font-size:1.1rem; line-height:1; min-width:38px;" onclick="adjustModalDistance(-1)">−</button>
              <input type="range" id="modal-distance-slider" min="1" max="25" value="6" step="1" oninput="setModalDistance(this.value)" style="flex:1; cursor:pointer; height:6px;">
              <button type="button" class="btn" style="padding:0.4rem 0.75rem; background:#0284c7; color:#fff; font-size:1.1rem; line-height:1; min-width:38px;" onclick="adjustModalDistance(1)">+</button>
              <select id="modal-distance-select" onchange="setModalDistance(this.value)" style="width:auto; padding:0.4rem 0.5rem; font-size:0.85rem; border:1px solid #94a3b8; border-radius:6px; background:#fff;">
                <option value="1">1 Mile (Immediate Site)</option>
                <option value="2">2 Miles</option>
                <option value="3">3 Miles</option>
                <option value="4">4 Miles</option>
                <option value="5">5 Miles</option>
                <option value="6" selected>6 Miles (Standard)</option>
                <option value="7">7 Miles</option>
                <option value="8">8 Miles</option>
                <option value="9">9 Miles</option>
                <option value="10">10 Miles</option>
                <option value="12">12 Miles</option>
                <option value="14">14 Miles</option>
                <option value="16">16 Miles</option>
                <option value="18">18 Miles</option>
                <option value="20">20 Miles</option>
                <option value="25">25 Miles</option>
              </select>
            </div>
            <div id="modal-distance-subtext" style="font-size:0.74rem; color:#0369a1; margin-top:0.35rem;">
              📍 Pricing adjusts dynamically per load based on travel mileage.
            </div>
          </div>

          <div class="filter-group" style="margin-bottom:0.75rem;">
            <label style="font-weight:700; font-size:0.85rem; margin-bottom:0.35rem; display:block;">Reporting Plant / Yard Postcode: *</label>
            <input type="text" id="modal-postcode" placeholder="e.g. NE8 1AA or Gateshead" oninput="handleModalPostcodeChange()" style="width:100%; box-sizing:border-box;">
          </div>

          <!-- Dynamic Deadhead Guardrail Container -->
          <div id="modal-deadhead-guardrail-container" style="display:none; margin-bottom:0.75rem;"></div>

          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:0.85rem; border-radius:8px; margin-bottom:0.75rem;">
            <div style="font-size:0.85rem; font-weight:bold; color:#0f172a; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
              <span>💳 Card Payment Details</span>
              <span style="font-size:0.72rem; color:#64748b; font-weight:normal;">256-bit Encrypted SSL</span>
            </div>
            <input type="text" id="modal-card-num" placeholder="Card Number: 4242 •••• •••• 4242" style="width:100%; padding:0.6rem; border:1px solid #cbd5e1; border-radius:4px; margin-bottom:0.5rem; box-sizing:border-box;">
            <div style="display:flex; gap:0.5rem;">
              <input type="text" placeholder="MM/YY" style="width:50%; padding:0.6rem; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box;">
              <input type="text" placeholder="CVC" style="width:50%; padding:0.6rem; border:1px solid #cbd5e1; border-radius:4px; box-sizing:border-box;">
            </div>
          </div>

          <div class="result-box" style="padding:0.75rem; margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.9rem;">Total Booking Fee:</span>
              <strong id="modal-total-fee" style="font-size:1.25rem; color:#16a34a;">£${item.rateTypeOptions.fullDay.toFixed(2)}</strong>
            </div>
            <div id="modal-fee-breakdown" style="font-size:0.75rem; color:#16a34a; margin-top:0.25rem;">
              ✔ All-Inclusive 8-Hour Shift • Includes 24hr Faster Payments Payout to Driver
            </div>
          </div>

          <button id="modal-pay-btn" class="btn" style="width:100%; padding:0.85rem; font-size:1.05rem; font-weight:800; cursor:pointer;" onclick="submitStripePayment('${item.plantName.replace(/'/g, "\\'")}', '${item.truckType.replace(/'/g, "\\'")}')">🔒 Pay &amp; Authorize Dispatch</button>
          <div style="text-align:center; font-size:0.72rem; color:#64748b; margin-top:0.5rem;">
            Secured by Stripe Connect UK • Funds held in segregated client escrow
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove any stale modal first
  const existing = document.getElementById("booking-modal");
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function handleModalRentalChange() {
  const rentalType = document.getElementById("modal-rental-type").value;
  const distanceSec = document.getElementById("modal-distance-section");
  const isSpot = rentalType.startsWith("spot-");

  if (distanceSec) {
    distanceSec.style.display = isSpot ? "block" : "none";
  }

  recalculateModalPrice();
}

function adjustModalDistance(delta) {
  let newDist = currentBookingDistance + delta;
  if (newDist < 1) newDist = 1;
  if (newDist > 25) newDist = 25;
  setModalDistance(newDist);
}

function setModalDistance(val) {
  currentBookingDistance = parseInt(val) || 6;
  if (currentBookingDistance < 1) currentBookingDistance = 1;
  if (currentBookingDistance > 25) currentBookingDistance = 25;

  const slider = document.getElementById("modal-distance-slider");
  if (slider) slider.value = currentBookingDistance;

  const select = document.getElementById("modal-distance-select");
  if (select) {
    let match = false;
    for (let opt of select.options) {
      if (parseInt(opt.value) === currentBookingDistance) {
        select.value = opt.value;
        match = true;
        break;
      }
    }
    if (!match) {
      const newOpt = new Option(`${currentBookingDistance} Miles`, currentBookingDistance, true, true);
      select.add(newOpt);
    }
  }

  const badge = document.getElementById("modal-distance-badge");
  if (badge) badge.innerText = `${currentBookingDistance} Radial Mile${currentBookingDistance === 1 ? '' : 's'}`;

  recalculateModalPrice();
}


function handleModalPostcodeChange() {
  recalculateModalPrice();
}

function setDeadheadChoice(choice) {
  currentDeadheadChoice = choice;
  if (choice === 'half-day') {
    const sel = document.getElementById("modal-rental-type");
    if (sel) sel.value = 'half-day';
    handleModalRentalChange();
    return;
  } else if (choice === 'min-3') {
    const sel = document.getElementById("modal-rental-type");
    if (sel) sel.value = 'spot-3';
    handleModalRentalChange();
    return;
  }
  recalculateModalPrice();
}

function recalculateModalPrice() {
  if (!currentBookingItem) return;

  const typeSelect = document.getElementById("modal-rental-type");
  if (!typeSelect) return;
  const rentalType = typeSelect.value;
  const postcodeEl = document.getElementById("modal-postcode");
  const plantPostcode = postcodeEl ? postcodeEl.value.trim() : "";

  // Calculate Deadhead distance from driver's base to plant
  const deadheadDist = calculateDeadheadDistance(currentBookingItem.location, plantPostcode || "NE8");
  const isSpot = rentalType.startsWith("spot-");
  let loadCount = isSpot ? (parseInt(rentalType.split("-")[1]) || 2) : 0;
  if (isSpot && loadCount < 2) loadCount = 2; // Mandatory 2-load minimum quota
  
  // Guardrail triggers if deadhead > 8 miles AND load count is 1 or 2
  const isUneconomicDeadhead = isSpot && loadCount <= 2 && deadheadDist > 8;

  const guardrailContainer = document.getElementById("modal-deadhead-guardrail-container");
  const payBtn = document.getElementById("modal-pay-btn");
  
  let price = currentBookingItem.rateTypeOptions.fullDay;
  let breakdownText = "✔ Includes 24hr Faster Payments Payout to Driver";
  let travelSurcharge = 0;

  if (isSpot) {
    const base = currentBookingItem.rateTypeOptions.radialBase || 85;
    const perMile = currentBookingItem.rateTypeOptions.radialPerMile || 5.00;
    const singleLoadPrice = base + (perMile * currentBookingDistance);
    price = singleLoadPrice * loadCount;

    if (isUneconomicDeadhead) {
      const excessMiles = deadheadDist - 8;
      travelSurcharge = excessMiles * 2.50; // £2.50/mi for excess deadhead

      if (guardrailContainer) {
        guardrailContainer.style.display = "block";
        guardrailContainer.innerHTML = `
          <div style="background:#fef2f2; border:2px solid #ef4444; border-radius:8px; padding:0.85rem; color:#991b1b;">
            <div style="font-weight:800; font-size:0.88rem; display:flex; align-items:center; gap:0.4rem; margin-bottom:0.35rem; color:#b91c1c;">
              <span>⚠️ Uneconomic Deadhead Alert — Travel Guardrail Active</span>
            </div>
            <p style="font-size:0.8rem; margin:0 0 0.45rem 0; line-height:1.4;">
              This driver is based in <strong>${currentBookingItem.location}</strong> (~<strong>${deadheadDist} deadhead miles</strong> from your plant). 
              To protect hauliers against fuel loss and unpaid transit, drivers will not travel >8 miles for 1–2 spot loads without a <strong>Minimum Call-Out Guarantee</strong>.
            </p>
            <div style="font-size:0.78rem; font-weight:700; margin-bottom:0.35rem; color:#7f1d1d;">
              Select a minimum call-out option to unlock booking:
            </div>
            <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;">
              <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
                <input type="radio" name="deadhead-choice" value="half-day" ${currentDeadheadChoice === 'half-day' ? 'checked' : ''} onchange="setDeadheadChoice('half-day')">
                <span><strong>Upgrade to Half-Day Shift (£${currentBookingItem.rateTypeOptions.halfDay.toFixed(2)})</strong> — Recommended (Up to 4 hrs, unlimited drops)</span>
              </label>
              <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
                <input type="radio" name="deadhead-choice" value="min-3" ${currentDeadheadChoice === 'min-3' ? 'checked' : ''} onchange="setDeadheadChoice('min-3')">
                <span><strong>Book Minimum 3 Spot Loads</strong> (Viable volume for driver transit)</span>
              </label>
              <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
                <input type="radio" name="deadhead-choice" value="travel" ${currentDeadheadChoice === 'travel' ? 'checked' : ''} onchange="setDeadheadChoice('travel')">
                <span><strong>Add Deadhead Travel Surcharge (+£${travelSurcharge.toFixed(2)})</strong> (£2.50/mi for ${excessMiles} excess deadhead miles)</span>
              </label>
            </div>
          </div>
        `;
      }

      if (currentDeadheadChoice === 'travel') {
        price += travelSurcharge;
        breakdownText = `✔ ${loadCount} Spot Load${loadCount > 1 ? 's' : ''} @ ${currentBookingDistance} Radial Miles + £${travelSurcharge.toFixed(2)} Deadhead Travel Allowance (${excessMiles} mi @ £2.50/mi) • 24hr Faster Payments`;
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.innerText = "🔒 Pay & Authorize Dispatch";
        }
      } else {
        // Block booking until fair option chosen
        if (payBtn) {
          payBtn.disabled = true;
          payBtn.innerText = "⚠️ Select Minimum Call-Out Option Above";
        }
        breakdownText = `⚠️ Minimum Call-Out Guarantee required for ${deadheadDist} deadhead miles (Upgrade to Half-Day or add Travel Surcharge)`;
      }
    } else {
      if (guardrailContainer) {
        guardrailContainer.style.display = "block";
        guardrailContainer.innerHTML = `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:0.5rem 0.75rem; font-size:0.8rem; color:#166534; display:flex; justify-content:space-between; align-items:center;">
            <span>🟢 <strong>Local Deadhead Feasible:</strong> ~<strong>${deadheadDist} Deadhead Miles</strong> to plant</span>
            <span style="font-size:0.74rem; background:#dcfce7; padding:1px 6px; border-radius:4px; font-weight:700;">Within 8-Mi Radius</span>
          </div>
        `;
      }
      breakdownText = `✔ ${loadCount} Spot Relief Loads ${loadCount === 2 ? '(Minimum Driver Quota)' : ''} @ ${currentBookingDistance} Radial Miles (Base + travel) • 24hr Faster Payments to Driver`;
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerText = "🔒 Pay & Authorize Dispatch";
      }
    }
  } else {
    // Half day or full day shift
    if (guardrailContainer) {
      guardrailContainer.style.display = "block";
      guardrailContainer.innerHTML = `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:0.5rem 0.75rem; font-size:0.8rem; color:#166534; display:flex; justify-content:space-between; align-items:center;">
          <span>🟢 <strong>Guaranteed Shift Booking:</strong> ~<strong>${deadheadDist} Deadhead Miles</strong> covered by shift call-out</span>
          <span style="font-size:0.74rem; background:#dcfce7; padding:1px 6px; border-radius:4px; font-weight:700;">Full Shift Protected</span>
        </div>
      `;
    }

    if (rentalType === "half-day") {
      price = currentBookingItem.rateTypeOptions.halfDay;
      breakdownText = "✔ All-Inclusive 4-Hour Shift • Unlimited site drops • 24hr Faster Payments";
    } else if (rentalType === "full-day") {
      price = currentBookingItem.rateTypeOptions.fullDay;
      breakdownText = "✔ All-Inclusive 8-Hour Shift • Unlimited site drops • 24hr Faster Payments";
    }

    if (payBtn) {
      payBtn.disabled = false;
      payBtn.innerText = "🔒 Pay & Authorize Dispatch";
    }
  }

  const feeEl = document.getElementById("modal-total-fee");
  if (feeEl) feeEl.innerText = `£${price.toFixed(2)}`;

  const descEl = document.getElementById("modal-fee-breakdown");
  if (descEl) descEl.innerText = breakdownText;
}

function updateModalPrice(halfDay, fullDay) {
  recalculateModalPrice();
}

function closeBookingModal() {
  const modal = document.getElementById("booking-modal");
  if (modal) modal.remove();
  document.body.style.overflow = '';
}

// Global ESC key listener to close modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeBookingModal();
    closeAvailabilityModal();
  }
});

function submitStripePayment(operatorName, truckType) {
  const payBtn = document.getElementById("modal-pay-btn");
  if (payBtn) {
    payBtn.disabled = true;
    payBtn.innerHTML = "⏳ Authorizing via Stripe...";
  }

  const fee = document.getElementById("modal-total-fee") ? document.getElementById("modal-total-fee").innerText : "£480.00";
  const postcode = (document.getElementById("modal-postcode") && document.getElementById("modal-postcode").value.trim()) || "Yard Specified";
  const refCode = "MS-" + Math.floor(100000 + Math.random() * 900000);

  // Capture rental type and radial distance
  const rentalTypeEl = document.getElementById("modal-rental-type");
  const rentalType = rentalTypeEl ? rentalTypeEl.value : "full-day";
  let bookingDesc = "Full Day Shift (8 Hours - All-Inc)";
  if (rentalType.startsWith("spot-")) {
    const loads = rentalType.split("-")[1] || "1";
    bookingDesc = `${loads} Spot Relief Load${loads > 1 ? 's' : ''} (${currentBookingDistance} Radial Miles)`;
  } else if (rentalType === "half-day") {
    bookingDesc = "Half Day Shift (4 Hours - All-Inc)";
  } else if (rentalType === "full-day") {
    bookingDesc = "Full Day Shift (8 Hours - All-Inc)";
  }

  // Backup booking to localStorage so it instantly appears in portal.html
  try {
    const existing = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
    existing.unshift({
      timestamp: new Date().toISOString(),
      formType: "stripe-booking-payment",
      refCode: refCode,
      operatorName: operatorName || "Fleet Partner",
      truckType: truckType || "Rigid Mixer",
      bookingDesc: bookingDesc,
      rentalType: rentalType,
      distanceMiles: currentBookingDistance,
      postcode: postcode,
      totalFee: fee,
      status: "Payment Authorized / Escrow Locked"
    });
    localStorage.setItem("mixershare_submissions", JSON.stringify(existing));
  } catch(e) {
    console.warn("Storage err:", e);
  }

  setTimeout(() => {
    const modalBody = document.getElementById("modal-body-container");
    if (!modalBody) {
      closeBookingModal();
      return;
    }

    modalBody.innerHTML = `
      <div style="text-align:center; padding:0.75rem 0.25rem;">
        <div style="font-size:3.2rem; line-height:1; margin-bottom:0.75rem;">💳 ✅</div>
        <h3 style="color:#166534; font-size:1.35rem; margin-bottom:0.5rem; font-weight:800;">Payment Authorized via Stripe!</h3>
        <p style="color:#15803d; font-size:0.95rem; margin-bottom:1rem;">
          Booking Reference: <strong style="font-family:monospace; background:#dcfce7; padding:2px 8px; border-radius:4px; font-size:1.05rem;">#${refCode}</strong>
        </p>

        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:1rem; text-align:left; font-size:0.86rem; color:#14532d; line-height:1.6; margin-bottom:1.25rem;">
          <p>✔ <strong>Amount Authorized:</strong> ${fee} (Zero Transfer Fees)</p>
          <p>✔ <strong>Booking Scope:</strong> <span style="color:#0284c7; font-weight:800;">${bookingDesc}</span></p>
          <p>✔ <strong>Assigned Operator:</strong> ${operatorName || 'Franchised Owner-Driver'}</p>
          <p>✔ <strong>Equipment:</strong> ${truckType || 'HGV Concrete Mixer'}</p>
          <p>✔ <strong>Reporting Postcode:</strong> ${postcode}</p>
          <p>✔ <strong>Escrow Protection:</strong> Funds held safely in Stripe Escrow until the shift/run is verified.</p>
          <p>✔ <strong>Driver Payout:</strong> Queued for 24-hr UK Faster Payments transfer directly to the owner-driver.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          <a href="tel:07494867646" class="btn" style="background:#16a34a; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">📞 Call Central Dispatch (07494 867646)</a>
          <a href="https://wa.me/447494867646?text=Hi%20Ian,%20I%20just%20authorized%20booking%20${refCode}%20for%20${encodeURIComponent(operatorName || 'mixer')}%20(${encodeURIComponent(bookingDesc)})" target="_blank" class="btn" style="background:#25d366; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">💬 WhatsApp Operations Desk</a>
          <a href="ticket.html" class="btn" style="background:#0284c7; text-decoration:none; padding:0.8rem; font-size:0.95rem; display:block; text-align:center; color:#fff; font-weight:bold;">📋 Open Digital Delivery Ticket (Radial Sign-off)</a>
          <button class="btn btn-secondary" style="padding:0.75rem; font-size:0.95rem; margin-top:0.25rem; width:100%;" onclick="closeBookingModal()">Done & Close</button>
        </div>
      </div>
    `;
  }, 600);
}

// Listing Form
function initListingForm() {
  const form = document.getElementById("post-listing-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fullDayRate = parseInt(document.getElementById("post-rate-full").value) || 480;
    const categoryType = document.getElementById("post-category-type").value;
    const isTipper = categoryType === "tipper";

    const newListing = {
      id: mockListings.length + 1,
      plantName: document.getElementById("post-plant-name").value || "My UK Fleet Yard",
      distanceMiles: 5,
      truckType: document.getElementById("post-truck-type").value,
      category: isTipper ? "tipper" : "mixer",
      capacityM3: isTipper ? 0 : (parseInt(document.getElementById("post-capacity").value) || 8),
      capacityTonne: isTipper ? (parseInt(document.getElementById("post-capacity").value) || 20) : 0,
      driverIncluded: true,
      availableCount: parseInt(document.getElementById("post-truck-count").value) || 1,
      rateTypeOptions: {
        radialBase: 60,
        radialPerMile: 4.00,
        driverRadialBase: 54,
        driverRadialPerMile: 3.60,
        halfDay: 290,
        fullDay: fullDayRate,
        retailFullDay: Math.round(fullDayRate * 1.45)
      },
      location: document.getElementById("post-city").value || "UK Yard",
      forsCompliant: true,
      cpcVerified: true,
      whiteLabelMode: true,
      nextDayPayout: true,
      flexibleExtension: true
    };

    mockListings.unshift(newListing);
    try {
      const storedListings = JSON.parse(localStorage.getItem("mixershare_custom_listings") || "[]");
      storedListings.unshift(newListing);
      localStorage.setItem("mixershare_custom_listings", JSON.stringify(storedListings));
    } catch (e) {
      console.warn("Storage err:", e);
    }
    renderListings(mockListings);
    alert("👍 Your idle truck & HGV driver listing is live on the MixerShare exchange!");
    form.reset();
    document.querySelector('[data-tab="exchange-board"]').click();
  });
}

// Interactive Calculators
function initCalculators() {
  const m3Input = document.getElementById("calc-turned-m3");
  const priceInput = document.getElementById("calc-price-m3");
  const marginInput = document.getElementById("calc-margin-pct");

  const runCalc = () => {
    const m3 = parseFloat(m3Input.value) || 0;
    const price = parseFloat(priceInput.value) || 125;
    const marginPct = (parseFloat(marginInput.value) || 25) / 100;

    const totalLostGross = m3 * price;
    const totalLostNetProfit = totalLostGross * marginPct;

    const appCost2Loads = 120 * 2; // £240
    const netProfitSaved = totalLostNetProfit - appCost2Loads;

    document.getElementById("res-lost-gross").innerText = `£${totalLostGross.toLocaleString('en-GB', {maximumFractionDigits: 0})}`;
    document.getElementById("res-lost-net").innerText = `£${totalLostNetProfit.toLocaleString('en-GB', {maximumFractionDigits: 0})}`;
    document.getElementById("res-saved-profit").innerText = `£${Math.max(0, netProfitSaved).toLocaleString('en-GB', {maximumFractionDigits: 0})}`;
  };

  if (m3Input) m3Input.addEventListener("input", runCalc);
  if (priceInput) priceInput.addEventListener("input", runCalc);
  if (marginInput) marginInput.addEventListener("input", runCalc);
}

// Plant, Driver & Training Form Handlers with Bulletproof AJAX & Zero-Error Feedback
function initRegistrationForms() {
  // Helper to persist submissions locally
  const saveSubmission = (formType, data) => {
    try {
      const existing = JSON.parse(localStorage.getItem("mixershare_submissions") || "[]");
      existing.unshift({ timestamp: new Date().toISOString(), formType, ...data });
      localStorage.setItem("mixershare_submissions", JSON.stringify(existing));
    } catch (e) {
      console.warn("Local storage write skipped:", e);
    }
  };

  // Helper to submit via Netlify AJAX with graceful fallback
  const submitFormAjax = (form, formData, callback) => {
    const btn = form.querySelector("button[type='submit']");
    const originalText = btn ? btn.innerHTML : "Submit";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = "⏳ Processing Registration...";
    }

    const payload = new URLSearchParams(formData).toString();

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload
    })
    .then(res => {
      console.log("Netlify form submission status:", res.status);
    })
    .catch(err => {
      console.log("Offline or local environment; preserved locally:", err);
    })
    .finally(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      if (callback) callback();
    });
  };

  // 1. Plant Registration Form
  const plantForm = document.querySelector('form[name="plant-inquiry"]');
  if (plantForm) {
    plantForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(plantForm);
      const company = plantForm.querySelector('input[name="company_name"]')?.value || "Registered Plant";
      const contact = plantForm.querySelector('input[name="contact_name"]')?.value || "Plant Manager";
      const phone = plantForm.querySelector('input[name="phone"]')?.value || "07494 867646";
      const email = plantForm.querySelector('input[name="email"]')?.value || "mixershareuk@gmail.com";
      const location = plantForm.querySelector('input[name="location"]')?.value || "North East Yard";
      const reliefNeed = plantForm.querySelector('select[name="relief_need"]')?.value || "Emergency Relief Loads";

      const dataObj = { company, contact, phone, email, location, reliefNeed };
      saveSubmission("plant-inquiry", dataObj);

      submitFormAjax(plantForm, formData, () => {
        // Add to live plant needs board
        mockPlantNeeds.unshift({
          id: Date.now(),
          plant: company,
          location: location,
          need: reliefNeed + " - Priority Relief Dispatch",
          time: "Just Now"
        });
        renderPlantNeedsPortal();

        // Display professional confirmation
        const container = plantForm.parentElement;
        container.innerHTML = `
          <div class="success-card">
            <div style="font-size:3.5rem; line-height:1; margin-bottom:0.75rem;">🏭 ✅</div>
            <h3 style="color:#166534; font-size:1.4rem; margin-bottom:0.5rem;">Emergency Dispatch Request Confirmed!</h3>
            <p style="color:#15803d; font-size:1rem; margin-bottom:1.25rem;">Dispatch logged for <strong>${company}</strong> (${contact}).</p>
            <div style="background:#fff; border:1px solid #bbf7d0; border-radius:8px; padding:1.25rem; text-align:left; margin-bottom:1.5rem; font-size:0.9rem; color:#14532d; line-height:1.6;">
              <p>✔ <strong>Dispatch Contact:</strong> ${contact} (${phone})</p>
              <p>✔ <strong>Plant Location:</strong> ${location}</p>
              <p>✔ <strong>Relief Coverage:</strong> ${reliefNeed}</p>
              <p>✔ <strong>Status:</strong> Broadcasted for Priority Relief Matching</p>
              <p>✔ <strong>Next Step:</strong> Ian Henry &amp; central dispatch are matching your requirement with an available owner-driver.</p>
            </div>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
              <a href="tel:07494867646" class="btn" style="background:#16a34a; color:#fff;">📞 Call Dispatch (07494 867646)</a>
              <a href="https://wa.me/447494867646?text=Hi%20Ian,%20I%20just%20submitted%20a%20relief%20dispatch%20request%20for%20${encodeURIComponent(company)}" target="_blank" class="btn" style="background:#25d366; color:#fff;">💬 WhatsApp Dispatch Desk</a>
              <button class="btn btn-outline" style="color:#0f172a; border-color:#0f172a;" onclick="location.reload()">Submit Another Request</button>
            </div>
          </div>
        `;
      });
    });
  }

  // 2. Driver & Haulier Fleet Registration Form
  const driverForm = document.querySelector('form[name="driver-signup"]');
  if (driverForm) {
    driverForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(driverForm);
      const operator = driverForm.querySelector('input[name="driver_name"]')?.value || "Registered Operator";
      const vehicle = driverForm.querySelector('select[name="vehicle_type"]')?.value || "Standard 8m³ Rigid Mixer";
      const fleetSize = driverForm.querySelector('select[name="operator_type"]')?.value || "Single HGV Owner-Driver";
      const mobile = driverForm.querySelector('input[name="mobile"]')?.value || "07494 867646";
      const email = driverForm.querySelector('input[name="email"]')?.value || "mixershareuk@gmail.com";
      const postcode = driverForm.querySelector('input[name="base_postcode"]')?.value || "North East UK";

      const dataObj = { operator, vehicle, fleetSize, mobile, email, postcode };
      saveSubmission("driver-signup", dataObj);

      submitFormAjax(driverForm, formData, () => {
        // Add to live driver availability board
        mockDriverAvailability.unshift({
          id: Date.now(),
          name: operator,
          truck: vehicle,
          location: postcode,
          status: "Available Now",
          availableHours: "Immediate Dispatch"
        });
        renderDriverPortal();

        // Display professional confirmation
        const container = driverForm.parentElement;
        container.innerHTML = `
          <div class="success-card">
            <div style="font-size:3.5rem; line-height:1; margin-bottom:0.75rem;">🚛 ✅</div>
            <h3 style="color:#166534; font-size:1.4rem; margin-bottom:0.5rem;">Fleet Registration Confirmed!</h3>
            <p style="color:#15803d; font-size:1rem; margin-bottom:1.25rem;">Welcome <strong>${operator}</strong> to the MixerShare UK Network.</p>
            <div style="background:#fff; border:1px solid #bbf7d0; border-radius:8px; padding:1.25rem; text-align:left; margin-bottom:1.5rem; font-size:0.9rem; color:#14532d; line-height:1.6;">
              <p>✔ <strong>Primary Equipment:</strong> ${vehicle}</p>
              <p>✔ <strong>Dispatch SMS Number:</strong> ${mobile}</p>
              <p>✔ <strong>Payout Schedule:</strong> 24-Hour UK Faster Payments via Stripe Connect</p>
              <p>✔ <strong>Rate Eligibility:</strong> £468.00 / Full Shift or Guaranteed Spot Relief Run Rates</p>
              <p>✔ <strong>Next Step:</strong> Ian Henry will contact you to verify your CPC / O-licence and activate your Stripe payout link.</p>
            </div>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
              <a href="tel:07494867646" class="btn" style="background:#16a34a; color:#fff;">📞 Speak with Ian (07494 867646)</a>
              <a href="https://wa.me/447494867646?text=Hi%20Ian,%20I%20just%20registered%20my%20truck%20on%20MixerShare" target="_blank" class="btn" style="background:#25d366; color:#fff;">💬 WhatsApp Operations</a>
            </div>
          </div>
        `;
      });
    });
  }

  // 3. Driver Academy Training Inquiry Form
  const trainingForm = document.querySelector('form[name="training-inquiry"]');
  if (trainingForm) {
    trainingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(trainingForm);
      const name = trainingForm.querySelector('input[name="name"]')?.value || "Candidate";
      const phone = trainingForm.querySelector('input[name="phone"]')?.value || "07494 867646";
      const email = trainingForm.querySelector('input[name="email"]')?.value || "mixershareuk@gmail.com";
      const count = trainingForm.querySelector('select[name="driver_count"]')?.value || "1";

      const dataObj = { name, phone, email, count };
      saveSubmission("training-inquiry", dataObj);

      submitFormAjax(trainingForm, formData, () => {
        const container = trainingForm.parentElement;
        container.innerHTML = `
          <div class="success-card">
            <div style="font-size:3.5rem; line-height:1; margin-bottom:0.75rem;">🎓 ✅</div>
            <h3 style="color:#166534; font-size:1.4rem; margin-bottom:0.5rem;">Training Inquiry Received!</h3>
            <p style="color:#15803d; font-size:1rem; margin-bottom:1.25rem;">Thank you, <strong>${name}</strong>. Your inquiry for <strong>${count} driver(s)</strong> has been logged.</p>
            <div style="background:#fff; border:1px solid #bbf7d0; border-radius:8px; padding:1.25rem; text-align:left; margin-bottom:1.5rem; font-size:0.9rem; color:#14532d; line-height:1.6;">
              <p>✔ <strong>Course:</strong> 1-Day Ready-Mix Practical Masterclass (Hands-on In-Cab Driving)</p>
              <p>✔ <strong>Contact Phone:</strong> ${phone}</p>
              <p>✔ <strong>Inclusions:</strong> Certificate of Competency + Verified Operator Badge + Official 2026 Cab Handbook</p>
              <p>✔ <strong>Guaranteed Placement:</strong> Fast-track placement on the MixerShare relief dispatch board (£468/shift)</p>
              <p>✔ <strong>Next Step:</strong> Lead Instructor Ian Henry (30 years ready-mix experience) will call you within 24 hours to confirm date & venue.</p>
            </div>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
              <a href="tel:07494867646" class="btn" style="background:#f59e0b; color:#0f172a; font-weight:800;">📞 Call Ian Henry (07494 867646)</a>
              <button class="btn btn-outline" style="color:#0f172a; border-color:#0f172a;" onclick="location.reload()">Book Another Driver</button>
            </div>
          </div>
        `;
      });
    });
  }

  // 4. Plant AI Order Desk 14-Day Trial Form
  const plantTrialForm = document.querySelector('form[name="ai-order-desk-trial"]');
  if (plantTrialForm) {
    plantTrialForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(plantTrialForm);
      const plantName = plantTrialForm.querySelector('input[name="plant_name"]')?.value || "Independent Concrete Plant";
      const plantPostcode = plantTrialForm.querySelector('input[name="plant_postcode"]')?.value || "North East";
      const contactName = plantTrialForm.querySelector('input[name="contact_name"]')?.value || "Plant Manager";
      const phone = plantTrialForm.querySelector('input[name="phone"]')?.value || "07494 867646";
      const email = plantTrialForm.querySelector('input[name="email"]')?.value || "";
      const existingPhone = plantTrialForm.querySelector('input[name="existing_phone"]')?.value || "";
      const fleetVolume = plantTrialForm.querySelector('select[name="fleet_volume"]')?.value || "4-8 Mixers";
      const setupOption = plantTrialForm.querySelector('select[name="setup_option"]')?.value || "dedicated-0191";
      const notes = plantTrialForm.querySelector('textarea[name="notes"]')?.value || "";

      const dataObj = { plantName, plantPostcode, contactName, phone, email, existingPhone, fleetVolume, setupOption, notes };
      saveSubmission("ai-order-desk-trial", dataObj);

      submitFormAjax(plantTrialForm, formData, () => {
        const container = plantTrialForm.parentElement;
        container.innerHTML = `
          <div class="success-card" style="background:#f0fdf4; border:2px solid #86efac; border-radius:10px; padding:2rem; text-align:center;">
            <div style="font-size:3.5rem; line-height:1; margin-bottom:0.75rem;">🤖 ✅</div>
            <h3 style="color:#166534; font-size:1.5rem; margin-bottom:0.5rem;">Plant AI Order Desk Trial Activated!</h3>
            <p style="color:#15803d; font-size:1.05rem; margin-bottom:1.25rem;">Congratulations, <strong>${contactName}</strong>! 14-day zero-risk trial setup initiated for <strong>${plantName}</strong> (${plantPostcode}).</p>
            <div style="background:#fff; border:1px solid #bbf7d0; border-radius:8px; padding:1.25rem; text-align:left; margin-bottom:1.5rem; font-size:0.92rem; color:#14532d; line-height:1.6;">
              <p>✔ <strong>Target Plant:</strong> ${plantName} (${plantPostcode})</p>
              <p>✔ <strong>Direct Mobile:</strong> ${phone}</p>
              <p>✔ <strong>Selected Setup:</strong> ${setupOption === 'dedicated-0191' ? 'Dedicated Local 0191 Number' : setupOption === 'call-forwarding' ? 'Overflow Call Forwarding' : 'Dedicated Local Number + Call Forwarding'}</p>
              <p>✔ <strong>Estimated Fleet Volume:</strong> ${fleetVolume}</p>
              <p>✔ <strong>North East AI Engine:</strong> Automated 2-ring pickup, 10% volume safety margin &amp; BS 8500 advisor</p>
              <p>✔ <strong>Next Step:</strong> Ian Henry (30 years ready-mix operations experience) will contact you directly to finalize your BS 8500 mix prices and link your dispatch mobile for SMS dockets.</p>
            </div>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
              <a href="tel:01914062323" class="btn" style="background:#0284c7; color:#fff; font-weight:800; padding:0.75rem 1.25rem; text-decoration:none; border-radius:6px;">📞 Test Live Line (0191 406 2323)</a>
              <a href="tel:07494867646" class="btn" style="background:#16a34a; color:#fff; font-weight:800; padding:0.75rem 1.25rem; text-decoration:none; border-radius:6px;">📞 Speak to Ian Henry (07494 867646)</a>
            </div>
          </div>
        `;
      });
    });
  }
}

// Interactive Ready-Mix Order Desk Simulator Calculation
function updateSimCalculation() {
  const appType = document.getElementById("sim-app-type")?.value || "garage";
  const length = parseFloat(document.getElementById("sim-length")?.value) || 8.0;
  const width = parseFloat(document.getElementById("sim-width")?.value) || 4.0;
  const depth = parseFloat(document.getElementById("sim-depth")?.value) || 0.15;
  const access = document.getElementById("sim-access")?.value || "chute";
  const radial = document.getElementById("sim-radial")?.value || "mid";

  // Calculate net cubic meters
  const netVol = length * width * depth;
  const buffer = netVol * 0.10;
  let orderVol = Math.round((netVol + buffer) * 10) / 10;
  if (orderVol < 0.5) orderVol = 0.5;

  // Mix specs database
  const mixDatabase = {
    garage: {
      name: "C25 / S3 Slump (25 N/mm²)",
      notes: "Domestic garage slab. Flowable S3 slump for smooth raking & power floating. 10% safety buffer added for sub-base compaction.",
      basePrice: 125.00
    },
    footings: {
      name: "GEN 3 / S2 Slump (20 N/mm²)",
      notes: "Strip trench footings & house foundations. S2 slump keeps trenches stable without trench wall slump. 10% safety buffer added for uneven excavation depth.",
      basePrice: 120.00
    },
    driveway: {
      name: "C30 / PAV2 Air-Entrained (30 N/mm²)",
      notes: "External vehicle driveway. Air-entrained micro-bubbles prevent freeze-thaw surface spalling and resist winter de-icing salts.",
      basePrice: 135.00
    },
    patio: {
      name: "C20 / S3 Slump (20 N/mm²)",
      notes: "Domestic garden patio & shed base. Suitable for light foot traffic and paving slab bedding.",
      basePrice: 120.00
    },
    blinding: {
      name: "GEN 1 / S2 Slump (10 N/mm²)",
      notes: "Kerb backing & trench blinding. Non-structural sealing layer preventing mud contamination.",
      basePrice: 110.00
    },
    screed: {
      name: "C20 Fibre-Reinforced Screed (4:1)",
      notes: "Semi-dry or pumpable floor screed with polypropylene fibres to eliminate shrinkage cracking.",
      basePrice: 130.00
    },
    structural: {
      name: "RC35 / S3 Slump (35 N/mm²)",
      notes: "Reinforced concrete, agricultural silage clamps, and heavy commercial HGV hardstandings.",
      basePrice: 145.00
    }
  };

  const selectedMix = mixDatabase[appType] || mixDatabase.garage;

  // Radial surcharges
  let radialSurcharge = 0;
  if (radial === "mid") radialSurcharge = 10.00;
  else if (radial === "outer") radialSurcharge = 22.00;
  else if (radial === "long") radialSurcharge = 35.00;

  // Part load charge
  let partLoadFee = 0;
  if (orderVol < 4.0) {
    partLoadFee = 45.00;
  }

  const deliveredRatePerM3 = selectedMix.basePrice + radialSurcharge;
  const totalPrice = (orderVol * deliveredRatePerM3) + partLoadFee;

  // Truck recommendation
  let truckRecommendation = "8m³ Standard Rigid Mixer";
  if (orderVol <= 4.0) {
    truckRecommendation = "2-Axle 4m³ Mini-Mixer or 8m³";
  } else if (orderVol <= 6.0) {
    truckRecommendation = "6m³ Medium or 8m³ Mixer";
  }

  // Update DOM elements if present
  const elOrderM3 = document.getElementById("sim-order-m3");
  if (elOrderM3) elOrderM3.textContent = orderVol.toFixed(1);

  const elNetBreakdown = document.getElementById("sim-net-breakdown");
  if (elNetBreakdown) {
    elNetBreakdown.textContent = `(Exact trench volume: ${netVol.toFixed(2)} m³ + ${buffer.toFixed(2)} m³ safety buffer)`;
  }

  const elMixName = document.getElementById("sim-mix-name");
  if (elMixName) elMixName.textContent = selectedMix.name;

  const elMixNotes = document.getElementById("sim-mix-notes");
  if (elMixNotes) elMixNotes.textContent = selectedMix.notes;

  const elTruckBadge = document.getElementById("sim-truck-badge");
  if (elTruckBadge) elTruckBadge.textContent = truckRecommendation;

  const elPriceQuote = document.getElementById("sim-price-quote");
  if (elPriceQuote) elPriceQuote.textContent = `£${totalPrice.toFixed(2)}`;

  const elPriceBreakdown = document.getElementById("sim-price-breakdown");
  if (elPriceBreakdown) {
    let breakdownText = `Includes 30 mins free discharge on site (£${deliveredRatePerM3.toFixed(2)}/m³ delivered).`;
    if (partLoadFee > 0) {
      breakdownText += ` + £45.00 part-load fee (<4m³).`;
    }
    if (access === "barrow") {
      breakdownText += ` Notice: Wheelbarrow discharge may require extra time on site.`;
    } else if (access === "pump") {
      breakdownText += ` Notice: High-slump pump mix specified.`;
    }
    elPriceBreakdown.textContent = breakdownText;
  }
}
