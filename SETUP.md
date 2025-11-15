# 🌱 EcoTrace Quiz - Setup Guide

## For Your Partner / Team Members

### Step 1: Clone the Repository

```bash
git clone git@github.com:frogginfan1/claude-hackathon-25.git
cd claude-hackathon-25
```

### Step 2: Set Up Python Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up API Key

You need an Anthropic API key for the chatbot to work. 

**Option A: Get your own API key (Recommended)**
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Set it as an environment variable:
   ```bash
   export ANTHROPIC_API_KEY='your-key-here'
   ```

### Step 5: Run the Application

```bash
python app.py
```

Then open your browser to: **http://localhost:5001**

## 🎯 Quick Start (One Command)

For convenience, you can run everything in one line:

```bash
ANTHROPIC_API_KEY='your-api-key-here' python app.py
```

## ⚠️ Troubleshooting

### Port 5001 Already in Use?
```bash
# Kill the process on port 5001
lsof -ti:5001 | xargs kill -9
```

### API Key Error?
Make sure you've exported the `ANTHROPIC_API_KEY` environment variable before running the app.

### Chatbot Not Working?
Check the console logs - if you see errors about the API key, that means it's not set correctly.

## 📝 Notes

- The API key is **not** stored in the repository for security reasons
- You need to set it as an environment variable every time you start a new terminal session
- For production, you would use a `.env` file and `python-dotenv` package

