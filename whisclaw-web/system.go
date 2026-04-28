package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type SystemInfo struct {
	Battery    BatteryInfo `json:"battery"`
	Uptime     string      `json:"uptime"`
	CPUTemp    float64     `json:"cpuTemp"`
	MemoryUsed uint64      `json:"memoryUsed"`
	MemoryTotal uint64     `json:"memoryTotal"`
}

type BatteryInfo struct {
	Present    bool    `json:"present"`
	Percent    int     `json:"percent"`
	Charging   bool    `json:"charging"`
	Status     string  `json:"status"`
}

func handleSystem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	info := SystemInfo{
		Battery: getBatteryInfo(),
		Uptime:  getUptime(),
		CPUTemp: getCPUTemp(),
	}

	if runtime.GOOS == "linux" {
		info.MemoryUsed, info.MemoryTotal = getMemoryInfo()
	} else {
		info.MemoryTotal = 16 * 1024 * 1024 * 1024
		info.MemoryUsed = 4 * 1024 * 1024 * 1024
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

func getBatteryInfo() BatteryInfo {
	info := BatteryInfo{Present: false, Percent: 100, Status: "unknown"}

	if runtime.GOOS != "linux" {
		return info
	}

	data, err := osReadFile("/sys/class/power_supply/Battery/status")
	if err == nil {
		status := strings.TrimSpace(string(data))
		info.Present = true
		if strings.Contains(status, "Charging") {
			info.Charging = true
			info.Status = "charging"
		} else if strings.Contains(status, "Full") {
			info.Status = "full"
		} else {
			info.Status = "discharging"
		}
	}

	percentData, err := osReadFile("/sys/class/power_supply/Battery/capacity")
	if err == nil {
		if p, err := strconv.Atoi(strings.TrimSpace(string(percentData))); err == nil {
			info.Percent = p
		}
	}

	return info
}

func getUptime() string {
	data, err := osReadFile("/proc/uptime")
	if err != nil {
		return "unknown"
	}
	parts := strings.Fields(string(data))
	if len(parts) >= 1 {
		if uptime, err := strconv.ParseFloat(parts[0], 64); err == nil {
			duration := time.Duration(int64(uptime)) * time.Second
			hours := int(duration.Hours())
			minutes := int(duration.Minutes()) % 60
			return strings.TrimSpace(fmt.Sprintf("%dh %dm", hours, minutes))
		}
	}
	return "unknown"
}

func getCPUTemp() float64 {
	if runtime.GOOS != "linux" {
		return 0
	}

	data, err := osReadFile("/sys/class/thermal/thermal_zone0/temp")
	if err != nil {
		return 0
	}
	temp, err := strconv.ParseFloat(strings.TrimSpace(string(data)), 64)
	if err != nil {
		return 0
	}
	return temp / 1000.0
}

func getMemoryInfo() (uint64, uint64) {
	data, err := osReadFile("/proc/meminfo")
	if err != nil {
		return 0, 0
	}
	lines := strings.Split(string(data), "\n")
	var memTotal, memAvailable uint64

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		switch fields[0] {
		case "MemTotal:":
			memTotal, _ = strconv.ParseUint(fields[1], 10, 64)
			memTotal *= 1024
		case "MemAvailable:":
			memAvailable, _ = strconv.ParseUint(fields[1], 10, 64)
			memAvailable *= 1024
		}
	}

	return memTotal - memAvailable, memTotal
}

func osReadFile(path string) ([]byte, error) {
	return exec.Command("cat", path).Output()
}