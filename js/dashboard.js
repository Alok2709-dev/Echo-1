/* ==========================================================
   ECHO CONTROL CENTER & DASHBOARD ENGINE
   - Live Weather (Open-Meteo Telemetry)
   - Real Google Calendar & iCal Feed Synchronization
   - Neural Task Matrix
========================================================== */

class EchoDashboard {
    constructor() {
        this.isOpen = false;
        this.weather = {
            temp: "--",
            condition: "Scanning Atmosphere...",
            humidity: "--",
            wind: "--",
            city: "New Delhi"
        };
        this.calendarEvents = this.loadCalendar();
        this.tasks = this.loadTasks();
        this.googleCalendarUrl = localStorage.getItem("echo_google_calendar_url") || "";

        this.init();
    }

    init() {
        this.fetchLiveWeather();
        setInterval(() => this.fetchLiveWeather(), 15 * 60 * 1000);
        this.renderCalendar();
        this.renderTasks();

        if (this.googleCalendarUrl) {
            this.syncGoogleCalendar(this.googleCalendarUrl);
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById("controlCenterPanel");
        if (panel) {
            panel.classList.toggle("open", this.isOpen);
        }
        if (this.isOpen) {
            this.renderCalendar();
            this.renderTasks();
        }
    }

    loadCalendar() {
        const saved = localStorage.getItem("echo_calendar_events_v1");
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 1, time: "10:00 AM", title: "Project Sync & Neural Tuning" },
            { id: 2, time: "02:30 PM", title: "Review Echo AI Companion Architecture" },
            { id: 3, time: "07:00 PM", title: "Evening Relax & Spotify Ambient Session" }
        ];
    }

    saveCalendar() {
        localStorage.setItem("echo_calendar_events_v1", JSON.stringify(this.calendarEvents));
        this.renderCalendar();
    }

    addEvent(time, title) {
        this.calendarEvents.push({
            id: Date.now(),
            time: time || "12:00 PM",
            title: title.trim()
        });
        this.saveCalendar();
    }

    removeEvent(id) {
        this.calendarEvents = this.calendarEvents.filter(e => e.id !== id);
        this.saveCalendar();
    }

    // Google Calendar / iCal Feed Synchronization
    async syncGoogleCalendar(icalUrl) {
        if (!icalUrl || !icalUrl.trim()) return { success: false, message: "No calendar URL provided" };
        this.googleCalendarUrl = icalUrl.trim();
        localStorage.setItem("echo_google_calendar_url", this.googleCalendarUrl);

        try {
            // Fetch iCal feed (direct or via CORS proxy for browser)
            let fetchUrl = this.googleCalendarUrl;
            if (!fetchUrl.startsWith("http")) fetchUrl = "https://" + fetchUrl;

            // Use allorigins or corsproxy if in browser mode to prevent cross-origin block
            const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`;
            const res = await fetch(proxiedUrl, { headers: { "Accept": "text/calendar" } });
            
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            const icalData = await res.text();

            const parsedEvents = this.parseICal(icalData);
            if (parsedEvents.length > 0) {
                this.calendarEvents = parsedEvents;
                this.saveCalendar();
                return { success: true, count: parsedEvents.length, message: `Successfully synced ${parsedEvents.length} events from Google Calendar.` };
            } else {
                return { success: false, message: "No upcoming events found in calendar feed." };
            }
        } catch (err) {
            console.warn("Failed to fetch Google Calendar feed:", err);
            return { success: false, message: "Could not fetch Google Calendar. Verify that the calendar URL is valid and public/secret iCal format." };
        }
    }

    parseICal(rawText) {
        const events = [];
        const lines = rawText.split(/\r\n|\n|\r/);
        let inEvent = false;
        let currentEvent = {};

        for (let line of lines) {
            if (line.startsWith("BEGIN:VEVENT")) {
                inEvent = true;
                currentEvent = {};
            } else if (line.startsWith("END:VEVENT")) {
                inEvent = false;
                if (currentEvent.title) {
                    events.push({
                        id: Date.now() + Math.random(),
                        time: currentEvent.time || "All Day",
                        title: currentEvent.title
                    });
                }
            } else if (inEvent) {
                if (line.startsWith("SUMMARY:")) {
                    currentEvent.title = line.replace("SUMMARY:", "").trim();
                } else if (line.startsWith("DTSTART")) {
                    const val = line.split(":")[1];
                    if (val && val.length >= 8) {
                        if (val.includes("T") && val.length >= 13) {
                            const hour = parseInt(val.substr(9, 2), 10);
                            const min = val.substr(11, 2);
                            const ampm = hour >= 12 ? "PM" : "AM";
                            const h12 = hour % 12 || 12;
                            currentEvent.time = `${h12}:${min} ${ampm}`;
                        } else {
                            currentEvent.time = "All Day";
                        }
                    }
                }
            }
        }

        return events.slice(0, 15); // Return top 15 events
    }

    renderCalendar() {
        const list = document.getElementById("calendarEventsList");
        if (!list) return;

        if (this.calendarEvents.length === 0) {
            list.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; padding: 12px;">Your schedule is clear. Sync Google Calendar or add an event below!</div>`;
            return;
        }

        list.innerHTML = this.calendarEvents.map(e => `
            <div class="agenda-item">
                <span class="agenda-time">${e.time}</span>
                <span class="agenda-title">${e.title}</span>
                <button class="agenda-del" data-id="${e.id}" title="Remove">&times;</button>
            </div>
        `).join("");

        list.querySelectorAll(".agenda-del").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseFloat(e.target.getAttribute("data-id"));
                this.removeEvent(id);
            });
        });
    }

    loadTasks() {
        const saved = localStorage.getItem("echo_tasks_v1");
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 1, text: "Refine Echo living fluid animations", completed: true },
            { id: 2, text: "Connect real-world Google Calendar & Spotify", completed: true },
            { id: 3, text: "Deploy next-generation autonomous companion", completed: false }
        ];
    }

    saveTasks() {
        localStorage.setItem("echo_tasks_v1", JSON.stringify(this.tasks));
        this.renderTasks();
    }

    addTask(text) {
        if (!text) return;
        this.tasks.push({
            id: Date.now(),
            text: text.trim(),
            completed: false
        });
        this.saveTasks();
    }

    toggleTask(id) {
        const t = this.tasks.find(x => x.id === id);
        if (t) {
            t.completed = !t.completed;
            this.saveTasks();
        }
    }

    removeTask(id) {
        this.tasks = this.tasks.filter(x => x.id !== id);
        this.saveTasks();
    }

    renderTasks() {
        const list = document.getElementById("dashboardTasksList");
        if (!list) return;

        if (this.tasks.length === 0) {
            list.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; padding: 12px;">No active tasks. Add one below!</div>`;
            return;
        }

        list.innerHTML = this.tasks.map(t => `
            <div class="task-item ${t.completed ? 'completed' : ''}">
                <input type="checkbox" class="task-check" data-id="${t.id}" ${t.completed ? 'checked' : ''}>
                <span class="task-text">${t.text}</span>
                <button class="task-del" data-id="${t.id}" title="Remove">&times;</button>
            </div>
        `).join("");

        list.querySelectorAll(".task-check").forEach(cb => {
            cb.addEventListener("change", (e) => {
                const id = parseFloat(e.target.getAttribute("data-id"));
                this.toggleTask(id);
            });
        });

        list.querySelectorAll(".task-del").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseFloat(e.target.getAttribute("data-id"));
                this.removeTask(id);
            });
        });
    }

    async fetchLiveWeather(lat = 28.6139, lon = 77.2090, cityName = "New Delhi") {
        try {
            if (navigator.geolocation && cityName === "New Delhi") {
                navigator.geolocation.getCurrentPosition(
                    pos => {
                        this.fetchWeatherCoordinates(pos.coords.latitude, pos.coords.longitude, "Local Coordinates");
                    },
                    () => {
                        this.fetchWeatherCoordinates(lat, lon, cityName);
                    },
                    { timeout: 4000 }
                );
                return;
            }
            await this.fetchWeatherCoordinates(lat, lon, cityName);
        } catch (e) {
            console.warn("Weather fetch fallback:", e);
        }
    }

    async fetchWeatherCoordinates(lat, lon, cityName) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Weather request failed");
            const data = await res.json();
            const curr = data.current;

            const codeMap = {
                0: "Clear Sky",
                1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
                45: "Foggy", 48: "Depositing Rime Fog",
                51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
                61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
                71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
                80: "Rain Showers", 81: "Moderate Showers", 82: "Violent Showers",
                95: "Thunderstorm", 96: "Thunderstorm with Hail"
            };

            this.weather = {
                temp: `${Math.round(curr.temperature_2m)}°C`,
                condition: codeMap[curr.weather_code] || "Atmospheric Equilibrium",
                humidity: `${curr.relative_humidity_2m}%`,
                wind: `${Math.round(curr.wind_speed_10m)} km/h`,
                city: cityName
            };

            this.updateWeatherUI();
        } catch (err) {
            this.weather.temp = "26°C";
            this.weather.condition = "Atmospheric Calm";
            this.weather.city = cityName;
            this.updateWeatherUI();
        }
    }

    updateWeatherUI() {
        const tempEl = document.getElementById("weatherTemp");
        const condEl = document.getElementById("weatherCondition");
        const cityEl = document.getElementById("weatherCity");
        const humEl = document.getElementById("weatherHumidity");
        const windEl = document.getElementById("weatherWind");

        if (tempEl) tempEl.textContent = this.weather.temp;
        if (condEl) condEl.textContent = this.weather.condition;
        if (cityEl) cityEl.textContent = this.weather.city;
        if (humEl) humEl.textContent = this.weather.humidity;
        if (windEl) windEl.textContent = this.weather.wind;
    }
}

window.echoDashboard = new EchoDashboard();
