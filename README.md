# Routine Tracker

A modern habit and routine tracking application built with **Next.js**, **TypeScript**, and **Supabase**, designed to provide a spreadsheet-style experience for tracking daily activities, habits, goals, and personal growth metrics.

![Routine Tracker Dashboard](./screenshots/dashboard.png)

---

## Overview

Routine Tracker helps users monitor and improve their daily routines through an intuitive spreadsheet-based logging interface. Unlike traditional habit trackers, it allows users to track multiple data types including numeric values, boolean completions, and custom units while providing instant progress insights.

The application is designed for users who prefer a structured, data-driven approach to self-improvement.

---

## Features

### Spreadsheet-Style Logging

* Excel-like habit tracking interface
* Monthly, weekly, and daily views
* Inline editing for rapid data entry
* Auto-save functionality
* Keyboard-friendly workflow

### Habit Management

* Create custom habits
* Organize habits into categories
* Define custom units (minutes, km, steps, yes/no, etc.)
* Set monthly goals
* Configure habit-specific tracking methods

### Progress Analytics

* Goal completion percentages
* Monthly totals and summaries
* Performance indicators
* Category-wise tracking
* Visual success rate calculations

### Multiple Habit Types

Track virtually anything:

#### Numeric Habits

Examples:

* Running distance
* Study hours
* Reading pages
* Water intake
* Exercise duration

#### Boolean Habits

Examples:

* Meditation completed
* Workout completed
* Slept before midnight
* Practiced flute
* Journaling

### Data Organization

* Category grouping
* Sticky category columns
* Sticky habit columns
* Chronological date navigation
* Historical tracking

### User Experience

* Responsive interface
* Clean dashboard design
* Instant synchronization
* Real-time updates
* Fast navigation between views

---

## Tech Stack

### Frontend

* Next.js 16
* React
* TypeScript
* Tailwind CSS

### Backend & Database

* Supabase
* PostgreSQL
* Row Level Security (RLS)

### Deployment

* Vercel

---

## Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   └── test-connection/
│
├── components/
│   ├── Header.tsx
│   ├── Dashboard.tsx
│   ├── LogGrid.tsx
│   ├── Settings.tsx
│   └── Footer.tsx
│
├── lib/
│   └── supabase.ts
│
└── types/
    └── index.ts
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd routine-tracker
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production Build

Build the application:

```bash
npm run build
```

Run production server:

```bash
npm start
```

---

## Database Design

### Categories

```sql
categories
├── id
├── name
└── created_at
```

### Habits

```sql
habits
├── id
├── category_id
├── name
├── unit
├── goal
├── habit_type
└── created_at
```

### Entries

```sql
entries
├── id
├── habit_id
├── entry_date
├── value_numeric
├── value_bool
└── created_at
```

---

## Example Use Cases

### Productivity

| Habit       | Unit    | Goal |
| ----------- | ------- | ---- |
| Development | Minutes | 400  |
| Reading     | Pages   | 300  |
| Deep Work   | Hours   | 100  |

### Fitness

| Habit        | Unit   | Goal   |
| ------------ | ------ | ------ |
| Running      | KM     | 30     |
| Steps        | Steps  | 200000 |
| Calisthenics | Yes/No | 15     |

### Personal Growth

| Habit          | Unit    | Goal |
| -------------- | ------- | ---- |
| Flute Practice | Minutes | 930  |
| Sketching      | Minutes | 930  |
| Meditation     | Minutes | 600  |

---

## Future Enhancements

* User authentication
* Multi-user support
* Habit streak tracking
* Advanced analytics
* Data export (CSV/Excel)
* Mobile responsive optimization
* Notifications and reminders
* Habit templates
* Goal forecasting
* Dark mode

---

## Deployment

The application is optimized for deployment on Vercel.

```bash
npm run build
```

Deploy directly from GitHub using Vercel's automated deployment pipeline.

---

## Author

**Rajath Kumar**

Final Year Artificial Intelligence & Machine Learning Engineering Student

Focused on:

* Full Stack Development
* Backend Engineering
* AI & Machine Learning
* Building practical productivity tools
