# ✈️ Flight Dexterity Test

A browser-based aviation training game that simulates a **Primary Flight Display (PFD)** coordination exercise. Players must chase and center the Flight Director by controlling aircraft pitch, roll, and airspeed to reach dynamically generated target parameters.

![Game Type](https://img.shields.io/badge/Type-Browser%20Game-blue)
![Tech Stack](https://img.shields.io/badge/Stack-HTML%20%7C%20CSS%20%7C%20JavaScript-orange)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 Overview

The Flight Dexterity Test is designed to help pilots (or aviation enthusiasts) practice hand-eye coordination and instrument interpretation skills. The game features a realistic PFD layout including:

- **Attitude Indicator** - Central horizon display with pitch ladder and bank angle
- **Speed Tape** - Left-side airspeed indicator (250-400 kts range)
- **Altitude Tape** - Right-side altitude indicator (20,000-32,000 ft range)
- **Heading Indicator** - Bottom compass rose with heading bug

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Pitch Control (nose up/down) |
| `←` / `→` | Roll Control (bank left/right) |
| `S` | Increase Speed |
| `X` | Decrease Speed |

## 🎯 Objective

**Chase and center the green Flight Director (FD) cross** by:
1. Matching the **target altitude** (climb/descend)
2. Matching the **target heading** (turn left/right)
3. Matching the **target airspeed** (speed up/slow down)

Target values are displayed in **magenta** on each respective tape. When all three parameters are achieved and stabilized for 1.5 seconds, new targets are generated.

## ⏱️ Game Duration

- **Total Time:** 3 minutes 30 seconds
- **Scoring:** Based on how well-centered the Flight Director remains throughout the test
- **Final Rating:** A+ / A / B / C / D / F based on average accuracy

## 🚀 How to Play

1. Open [index.html]in any modern web browser
2. Click **START TEST** to begin
3. Use keyboard controls to maneuver the aircraft
4. Keep the Flight Director centered to maximize your score
5. Review your final score and rating when time expires


## 🎨 Design Features

- **B612 Font** - The open-source font designed for aircraft cockpit screens
- **Realistic PFD Layout** - Modeled after modern glass cockpit displays
- **Smooth Animations** - Canvas-based rendering with physics simulation
- **Responsive Controls** - Inertia-based flight dynamics for realistic feel

## 🔧 Technical Details

- **Pure Vanilla JavaScript** - No external dependencies
- **HTML5 Canvas** - For dynamic instrument rendering
- **High DPI Support** - Crisp visuals on Retina/4K displays
- **Physics Simulation** - Includes damping, velocity limits, and smooth interpolation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).



