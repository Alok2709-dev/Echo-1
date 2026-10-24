/* ==========================================================
   ECHO CONTROL CENTER & DASHBOARD ENGINE
   Live Weather, Calendar Agenda & Task Matrix
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

        this.init();
    }

    init() {
        this.fetchLiveWeather();
        // Refresh weather every 15 minutes
        setInterval(() => this.fetchLiveWeather(), 15 * 60 * 1000);
    }

    loadCalendar() {
        const saved = localStorage.getItem("echo_calendar_events_v1");
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 1, time: "09:30 AM", title: "Morning Neural Calibration & Coffee" },
            { id: 2, time: "02:00 PM", title: "Echo Architecture & Deep Learning Review" },
            { id: 3, time: "06:30 PM", title: "Sunset Walk & Ambient Audio Session" }
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

    loadTasks() {
        const saved = localStorage.getItem("echo_tasks_v1");
        if (saved) {
            try { return JSON.parse(saved); } catch (e) {}
        }
        return [
            { id: 1, text: "Refine Echo living fluid animations", completed: true },
            { id: 2, text: "Connect real-world weather & calendar matrix", completed: true },
            { id: 3, text: "Build next-gen autonomous JARVIS workflows", completed: false }
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

    async fetchLiveWeather(lat = 28.6139, lon = 77.2090, cityName = "New Delhi") {
        try {
            // Geolocation fallback
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
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const curr = data.current;

            this.weather = {
                temp: Math.round(curr.temperature_2m) + "°C",
                condition: this.getWeatherDescription(curr.weather_code),
                humidity: curr.relative_humidity_2m + "%",
                wind: Math.round(curr.wind_speed_10m) + " km/h",
                city: cityName
            };

            this.renderWeather();
        } catch (e) {
            console.warn("Weather API call failed:", e);
        }
    }

    getWeatherDescription(code) {
        if (code === 0) return "Clear Sky";
        if (code === 1 || code === 2) return "Partly Cloudy";
        if (code === 3) return "Overcast";
        if (code >= 45 && code <= 48) return "Foggy Atmosphere";
        if (code >= 51 && code <= 67) return "Rain Showers";
        if (code >= 71 && code <= 77) return "Snow Flurries";
        if (code >= 80 && code <= 82) return "Heavy Rain";
        if (code >= 95) return "Thunderstorm Lightning";
        return "Calm Atmosphere";
    }

    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById("controlCenterPanel");
        if (panel) {
            panel.classList.toggle("open", this.isOpen);
            if (this.isOpen) {
                this.renderAll();
                if (window.echoSounds) window.echoSounds.playListenTick();
            }
        }
    }

    renderAll() {
        this.renderWeather();
        this.renderCalendar();
        this.renderTasks();
    }

    renderWeather() {
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

    renderCalendar() {
        const list = document.getElementById("calendarEventsList");
        if (!list) return;
        list.innerHTML = "";

        if (this.calendarEvents.length === 0) {
            list.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; padding: 12px;">No events scheduled today.</div>`;
            return;
        }

        this.calendarEvents.forEach(item => {
            const div = document.createElement("div");
            div.className = "agenda-item";
            div.innerHTML = `
                <div class="agenda-time">${item.time}</div>
                <div class="agenda-title">${item.title}</div>
                <button class="agenda-del" data-id="${item.id}">&times;</button>
            `;
            list.appendChild(div);
        });

        list.querySelectorAll(".agenda-del").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseInt(e.target.getAttribute("data-id"), 10);
                this.removeEvent(id);
            });
        });
    }

    renderTasks() {
        const list = document.getElementById("dashboardTasksList");
        if (!list) return;
        list.innerHTML = "";

        if (this.tasks.length === 0) {
            list.innerHTML = `<div style="color: rgba(255,255,255,0.4); font-size: 13px; text-align: center; padding: 12px;">All tasks completed!</div>`;
            return;
        }

        this.tasks.forEach(t => {
            const div = document.createElement("div");
            div.className = `task-row ${t.completed ? "completed" : ""}`;
            div.innerHTML = `
                <div class="task-check" data-id="${t.id}">
                    ${t.completed ? "✓" : ""}
                </div>
                <div class="task-text">${t.text}</div>
                <button class="task-del" data-id="${t.id}">&times;</button>
            `;
            list.appendChild(div);
        });

        list.querySelectorAll(".task-check").forEach(box => {
            box.addEventListener("click", (e) => {
                const id = parseInt(e.target.getAttribute("data-id"), 10);
                this.toggleTask(id);
                if (window.echoSounds) window.echoSounds.playResponseChime();
            });
        });

        list.querySelectorAll(".task-del").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseInt(e.target.getAttribute("data-id"), 10);
                this.removeTask(id);
            });
        });
    }
}

window.echoDashboard = new EchoDashboard();
