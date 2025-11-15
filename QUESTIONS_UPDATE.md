# 📊 Data-Driven Questions Update

## Overview
Updated quiz questions based on the **Carbon Emission.csv** dataset with **10,000 real data points**.

All questions now reflect actual patterns from the dataset, excluding Body Type, Sex, and Energy Efficiency as requested.

---

## 🏠 HOME CATEGORY (3 Questions)

### Question 1: Heating Energy Source
**Type:** Multiple Choice
- Electricity (200 kg CO₂)
- Natural gas (350 kg CO₂)
- Wood (450 kg CO₂)
- Coal (650 kg CO₂)

**Data Source:** `Heating Energy Source` column

### Question 2: TV/Computer Usage
**Type:** Slider (0-24 hours)
**CO₂ Calculation:** 8 kg CO₂ per hour per year

**Data Source:** `How Long TV PC Daily Hour` column (Range: 0-24)

### Question 3: Internet Usage
**Type:** Slider (0-24 hours)
**CO₂ Calculation:** 5 kg CO₂ per hour per year

**Data Source:** `How Long Internet Daily Hour` column (Range: 0-24)

---

## 🚗 MOBILITY CATEGORY (3 Questions)

### Question 4: Primary Transportation
**Type:** Multiple Choice
- Walk/Bicycle (50 kg CO₂)
- Public transport (250 kg CO₂)
- Private vehicle (550 kg CO₂)

**Data Source:** `Transport` column

### Question 5: Monthly Vehicle Distance
**Type:** Slider (0-10,000 km)
**CO₂ Calculation:** 0.15 kg CO₂ per km per year

**Data Source:** `Vehicle Monthly Distance Km` column (Range: 0-9,999)

### Question 6: Air Travel Frequency
**Type:** Multiple Choice
- Never (0 kg CO₂)
- Rarely (200 kg CO₂)
- Frequently (600 kg CO₂)
- Very frequently (1,200 kg CO₂)

**Data Source:** `Frequency of Traveling by Air` column

---

## 🍽️ FOOD CATEGORY (3 Questions)

### Question 7: Diet Type
**Type:** Multiple Choice
- Vegan (150 kg CO₂)
- Vegetarian (250 kg CO₂)
- Pescatarian (350 kg CO₂)
- Omnivore (600 kg CO₂)

**Data Source:** `Diet` column

### Question 8: Monthly Grocery Bill
**Type:** Slider ($50-$300)
**CO₂ Calculation:** 3 kg CO₂ per dollar per year

**Data Source:** `Monthly Grocery Bill` column (Range: $50-$299)

### Question 9: Weekly Waste Bags
**Type:** Slider (1-7 bags)
**CO₂ Calculation:** 25 kg CO₂ per bag per year

**Data Source:** `Waste Bag Weekly Count` column (Range: 1-7)

---

## 🛍️ CONSUMPTION CATEGORY (3 Questions)

### Question 10: New Clothes Per Month
**Type:** Slider (0-50 items)
**CO₂ Calculation:** 8 kg CO₂ per item per year

**Data Source:** `How Many New Clothes Monthly` column (Range: 0-50)

### Question 11: Waste Bag Size
**Type:** Multiple Choice
- Small (100 kg CO₂)
- Medium (200 kg CO₂)
- Large (350 kg CO₂)
- Extra large (500 kg CO₂)

**Data Source:** `Waste Bag Size` column

### Question 12: Shower Frequency
**Type:** Multiple Choice
- Less frequently / every 2-3 days (80 kg CO₂)
- Daily (150 kg CO₂)
- More frequently / 1.5x per day (220 kg CO₂)
- Twice a day (300 kg CO₂)

**Data Source:** `How Often Shower` column

---

## 🎨 UI/UX Improvements

### Slider Questions
- **Large Value Display**: Shows current value prominently
- **Interactive Slider**: Smooth dragging with visual feedback
- **Min/Max Labels**: Clear range indicators
- **Continue Button**: Explicit confirmation before advancing
- **Bubbly Design**: Matches the overall aesthetic with rounded corners and soft colors

### Multiple Choice Questions
- **Maintained**: Existing button-based interface
- **Consistent**: Same styling and interaction patterns

### Previous Button
- **Enabled**: Users can go back and change any answer
- **Smart Tracking**: Detects and logs answer changes
- **Chatbot Aware**: All changes are immediately visible to EcoCoach

---

## 🤖 Chatbot Integration

The chatbot now has access to:
- ✅ Slider values (e.g., "You travel 5,000 km per month")
- ✅ Multiple choice selections
- ✅ Question numbers and categories
- ✅ All answer changes when users go back

Example chatbot queries:
- *"Why did I get a high score in Mobility?"*
- *"What did I answer for my diet?"*
- *"How many hours of internet usage did I report?"*

---

## 📈 Dataset Statistics

**Total Records:** 10,000
**Categories:** 4 (Home, Mobility, Food, Consumption)
**Question Types:** 
- Multiple Choice: 6 questions
- Slider: 6 questions

**Excluded Columns (as requested):**
- Body Type
- Sex
- Energy efficiency

---

## 🔄 Technical Implementation

### Backend (app.py)
- Added `type` field to questions ("slider" or "multiple_choice")
- Slider questions include: `min`, `max`, `unit`, `co2_per_unit`
- CO₂ calculations are dynamic based on slider values

### Frontend (script.js)
- `createSliderQuestion()`: Renders interactive sliders
- `selectSliderAnswer()`: Handles slider value storage
- Proper tracking for both question types

### Styling (style.css)
- `.slider-container`: Main slider wrapper with bubbly design
- `.slider-input`: Custom-styled range input
- `.slider-value-display`: Large, prominent value display
- Hover effects and transitions for smooth UX

---

## ✅ Testing

Server running at: **http://localhost:5001**

Try the quiz to experience:
1. Mix of slider and multiple choice questions
2. Previous button to change answers
3. Chatbot that understands your specific answers
4. Beautiful bubbly UI throughout

