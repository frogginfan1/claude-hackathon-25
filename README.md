# 🌱 EcoTrace - Sustainability Quiz with AI Coach

A beautiful, interactive sustainability quiz that calculates your carbon footprint and provides personalized recommendations. Features an AI-powered chatbot (EcoCoach) that helps users understand their environmental impact.

![Built with](https://img.shields.io/badge/Flask-3.0.0-green)
![AI Powered](https://img.shields.io/badge/AI-Claude_Sonnet_4-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- 🎨 **Beautiful Bubbly UI** - Clean, modern design with pastel green aesthetics
- 📊 **12-Question Quiz** - Covers Home, Mobility, Food, and Consumption categories
- 🤖 **AI Chatbot (EcoCoach)** - Powered by Claude Sonnet 4, helps answer questions during the quiz and analyzes results
- 📈 **Personalized Results** - Detailed breakdown by category with comparisons to averages
- 💡 **Smart Recommendations** - Actionable tips and product suggestions
- ⬅️ **Previous Button** - Go back and change answers during the quiz
- 📱 **Fully Responsive** - Works on all devices

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Anthropic API Key (for chatbot functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:frogginfan1/claude-hackathon-25.git
   cd claude-hackathon-25
   ```

2. **Set up virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up API key** ⚠️ **IMPORTANT**
   
   The chatbot requires an Anthropic API key. Set it as an environment variable:
   ```bash
   export ANTHROPIC_API_KEY='your-api-key-here'
   ```
   
   **For team members:** See [SETUP.md](SETUP.md) for the shared API key or get your own at https://console.anthropic.com/settings/keys

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open in browser**
   ```
   http://localhost:5001
   ```

### One-Line Setup (Quick Demo)

```bash
ANTHROPIC_API_KEY='your-key' python app.py
```

## 📁 Project Structure

```
claude-hackathon-25/
├── app.py                 # Flask backend with quiz logic and Claude API integration
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Bubbly UI styling
│   └── js/
│       └── script.js     # Frontend logic and chatbot integration
└── venv/                 # Virtual environment (not in git)
```

## 🎯 How It Works

### Quiz Flow
1. **Start Screen** - Welcome with floating bubble animations
2. **Quiz Questions** - 12 randomized questions across 4 categories
3. **Progress Tracking** - Visual progress bar and question counter
4. **Navigation** - Auto-advance or use Previous button to change answers
5. **Results** - Detailed breakdown with personalized tips and products

### Chatbot Features
- **Context-Aware** - Knows which question you're on
- **Answer Tracking** - Remembers all your quiz answers
- **Results Analysis** - Can explain which choices impacted your score
- **General Help** - Answers sustainability questions anytime

Example questions to ask EcoCoach:
- *"What should I answer for this question?"*
- *"Why is my Mobility score high?"*
- *"Which of my answers contributed to my emissions?"*
- *"How can I reduce my carbon footprint?"*

## 🔧 API Endpoints

### Quiz Endpoints
- `GET /` - Main application
- `GET /api/questions` - Get randomized quiz questions
- `POST /api/calculate` - Calculate CO2 emissions from answers

### Chatbot Endpoints
- `POST /chat` - Send message to EcoCoach
- `POST /clear-chat` - Clear chat history

## 🎨 Design System

- **Colors**: OKLCH color space with pastel greens
- **Typography**: Quicksand (headings) + Inter (body)
- **Layout**: 12-column grid, max-width 900px for quiz
- **Animations**: Smooth transitions, floating bubbles, hover effects
- **Shadows**: Layered depth with soft shadows

## 🤝 For Team Members

If the chatbot isn't working for you, it's because you need to set up the API key. See [SETUP.md](SETUP.md) for detailed instructions.

**Quick fix:**
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
python app.py
```

Get your API key from: https://console.anthropic.com/settings/keys

## 🐛 Troubleshooting

### Port 5001 Already in Use
```bash
lsof -ti:5001 | xargs kill -9
python app.py
```

### Chatbot Returns Errors
- Make sure `ANTHROPIC_API_KEY` is set
- Check console logs for API errors
- Verify API key is valid at https://console.anthropic.com

### Questions Not Loading
- Ensure virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`

## 📊 Categories & Emissions

- **Home**: Electricity, heating, insulation (Avg: 2000 kg CO₂/year)
- **Mobility**: Transportation, commute, flights (Avg: 2500 kg CO₂/year)
- **Food**: Diet, local food, waste (Avg: 2000 kg CO₂/year)
- **Consumption**: Shopping, clothing, plastic (Avg: 1500 kg CO₂/year)

## 🏆 Hackathon Features

This project was built for the Claude API Hackathon with focus on:
- **Claude API Integration** - Sophisticated chatbot with context awareness
- **Performance** - Optimized prompts and conversation history management
- **User Experience** - Beautiful UI with intuitive interactions
- **Practical Value** - Real sustainability impact with actionable advice

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Credits

Built with Flask, Claude Sonnet 4, and lots of ☕
