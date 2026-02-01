# UI Design Style Guide & GenAI Prompt

## 1. Abstract Stylistic Breakdown

### Global Atmosphere & Layout Strategy
* **Concept:** "Card-on-Canvas" hierarchy. The design avoids high-contrast black borders, relying instead on spacing and subtle color shifts.
* **Background Layering:**
    * **Rear Viewport:** `#DCEBFF` (Light Blue) - Creates a soft, immersive environment outside the main app.
    * **App Canvas:** `#F1F2F8` (Light Grey) - The container for the dashboard.
    * **Content Cards:** `#FEFEFE` (White) - The surface for all widgets and charts.

### The "Etched" 3D Separator Effect
A specific soft-UI technique used to create horizontal divisions that look like grooves.
* **Structure:** Two stacked 1px lines.
* **Top Line:** `#EDEEF5` or `#EFEFEF` (Simulates the inner shadow).
* **Bottom Line:** `#EFF1F5` or `#FEFEFE` (Simulates the light catching the bottom edge).

### Shadows & Depth
* **Resting State (Standard Cards):** Minimal lift. `0px 1px 3px rgba(0,0,0,0.05)`.
* **Floating State (Pop-overs):** High diffusion "levitation". `0px 20px 40px` using a blend of `#7F91AF` at very low opacity (10-15%).

### Typography Palette
* **Primary Headers (High Contrast):** `#192A4B` or `#292F51` (Anthracite Blue).
* **Secondary/Axis Labels:** `#7B7C90` or `#56596F` (Dark Grey).
* **Meta/Tertiary:** `#7F91AF` (Blue-tinted Grey).

---

## 2. GenAI Frontend Prompt

**System Role:**
You are an expert UI/UX designer specializing in clean, modern Dashboard interfaces with Soft-UI (Neumorphism) influences.

**Task:**
Generate a frontend design for a this project

**Strict Visual Rules & Color Implementation:**

1.  **Layout & Backgrounds:**
    * Set the main viewport background to **#DCEBFF**.
    * Place the central dashboard container on a canvas of **#F1F2F8**.
    * Render all data widgets and cards with a **#FEFEFE** (pure white) background.
    * Use a border-radius of **12px-16px** for all cards.

2.  **Specific 3D Details:**
    * **Separators:** Separate major horizontal sections using an "etched" line effect. This must be a 2px high element consisting of a top line in **#EDEEF5** and a bottom line in **#EFF1F5**.
    * **Shadows:** Apply a "Floating Shadow" to any active pop-ups (like the 'Active Users' card) using a large blur radius (approx 40px) colored with a low-opacity **#7F91AF**.

3.  **Typography & Text Hierarchy:**
    * **Headlines & Values:** Use **#192A4B** or **#292F51** (Anthracite Blue) for the most important numbers.
    * **Labels & Axes:** Use **#7B7C90** or **#56596F** for descriptive text.
    * **Subtle Text:** Use **#7F91AF** for timestamps or minor legends.

4.  **Data Visualization & Component Colors:**
    * **Primary Accent:** Use **#2680F1** (Blue) and **#2A87F7** for main chart lines, active buttons, and primary highlights.
    * **Secondary Elements:** Use **#DCE4EA** and **#BEC8DD** (Light Greys) for unselected chart bars, grid lines, or placeholder data.
    * **UI Controls:** Use **#CDDDF5** (Light Blue) for slider tracks and progress bar backgrounds.
    * **Iconography:** Render standard navigation or menu icons in **#455878** (Dark Blue Grey).

5.  **Status Indicators:**
    * **Success/Growth:** Use **#55B368** or **#4C9369** (Emerald Green).
    * **Alert/Churn:** Use **#D95A5C** (Red).
    * **Pending/Open:** Use **#EAB308** (Yellow-500).