package main

import (
	"bufio"
	"fmt"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"golang.org/x/sys/unix"
)

// SystemStatus holds system information
type SystemStatus struct {
	Version string     `json:"version"`
	Uptime  float64    `json:"uptime"`
	Battery int        `json:"battery"`
	CPU     float64    `json:"cpu"`
	Memory  MemoryInfo `json:"memory"`
}

// MemoryInfo holds memory statistics
type MemoryInfo struct {
	Total     uint64  `json:"total"`
	Used      uint64  `json:"used"`
	Available uint64  `json:"available"`
	Percent   float64 `json:"percent"`
}

// getSystemStatus returns current system status
func getSystemStatus() SystemStatus {
	uptime := getUptime()
	cpu := getCPUUsage()
	mem := getMemoryUsage()
	battery := getBatteryLevel()

	return SystemStatus{
		Version: "1.0.0",
		Uptime:  uptime,
		Battery: battery,
		CPU:     cpu,
		Memory:  mem,
	}
}

// getUptime returns system uptime in seconds
func getUptime() float64 {
	var info unix.Sysinfo_t
	if err := unix.Sysinfo(&info); err != nil {
		return 0
	}
	return float64(info.Uptime)
}

// getCPUUsage returns CPU usage percentage
func getCPUUsage() float64 {
	// Get CPU stats
	stats1 := readCPUStats()
	time.Sleep(100 * time.Millisecond)
	stats2 := readCPUStats()

	total := (stats2.user + stats2.system + stats2.idle + stats2.nice + stats2.iowait + stats2.irq + stats2.softirq) -
		(stats1.user + stats1.system + stats1.idle + stats1.nice + stats1.iowait + stats1.irq + stats1.softirq)

	if total == 0 {
		return 0
	}

	idle := stats2.idle - stats1.idle
	return ((total - idle) / total) * 100
}

type cpuStats struct {
	user, nice, system, idle, iowait, irq, softirq float64
}

func readCPUStats() cpuStats {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return cpuStats{}
	}

	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	if scanner.Scan() {
		line := scanner.Text()
		// Parse first line: cpu user nice system idle iowait irq softirq
		var user, nice, system, idle, iowait, irq, softirq uint64
		fmt.Sscanf(line, "cpu %d %d %d %d %d %d %d",
			&user, &nice, &system, &idle, &iowait, &irq, &softirq)

		return cpuStats{
			user:    float64(user),
			nice:    float64(nice),
			system:  float64(system),
			idle:    float64(idle),
			iowait:  float64(iowait),
			irq:     float64(irq),
			softirq: float64(softirq),
		}
	}
	return cpuStats{}
}

// getMemoryUsage returns memory usage information
func getMemoryUsage() MemoryInfo {
	var info unix.Sysinfo_t
	if err := unix.Sysinfo(&info); err != nil {
		return MemoryInfo{}
	}

	total := info.Totalram
	available := info.Freeram
	used := total - available

	var percent float64
	if total > 0 {
		percent = float64(used) / float64(total) * 100
	}

	return MemoryInfo{
		Total:     total,
		Used:      used,
		Available: available,
		Percent:   percent,
	}
}

// getBatteryLevel returns battery percentage
// Returns 75 as fallback if i2c fails (PiSugar 3)
func getBatteryLevel() int {
	battery, err := readBatteryI2C()
	if err != nil {
		return 75
	}
	return battery
}

// readBatteryI2C reads battery level from PiSugar 3 via i2c
func readBatteryI2C() (int, error) {
	// Try to read from PiSugar battery via sysfs
	data, err := os.ReadFile("/sys/class/power_supply/piSugar-battery/capacity")
	if err == nil {
		percent, err := strconv.Atoi(strings.TrimSpace(string(data)))
		if err == nil {
			return percent, nil
		}
	}

	// Try voltage-based calculation via /sys/class/power_supply
	voltageData, err := os.ReadFile("/sys/class/power_supply/piSugar-battery/voltage_now")
	if err == nil {
		voltage, err := strconv.ParseFloat(strings.TrimSpace(string(voltageData)), 64)
		if err == nil {
			// voltage is in microvolts, convert to mV and then to percentage
			// Typical range: 3000mV (empty) to 4200mV (full)
			mv := voltage / 1000
			percent := int((mv - 3000) / 12)
			if percent < 0 {
				percent = 0
			}
			if percent > 100 {
				percent = 100
			}
			return percent, nil
		}
	}

	return 75, fmt.Errorf("could not read battery from i2c or sysfs")
}

// getGoVersion returns the Go version
func getGoVersion() string {
	return runtime.Version()
}
