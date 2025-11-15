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

### Step 4: Set Up API Key ⚠️ IMPORTANT

You need an Anthropic API key for the chatbot to work. **Everyone needs their own API key.**

**How to get and set up your API key:**

1. **Get your API key:**
   - Go to https://console.anthropic.com/settings/keys
   - Sign up or log in
   - Create a new API key (free tier available)

2. **Create a `.env` file in the project root:**
   ```bash
   # Create the file
   touch .env
   
   # Open it in your editor
   nano .env
   # OR
   code .env
   ```

3. **Add your API key to the `.env` file:**
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
   FLASK_SECRET_KEY=your-random-secret-key-here
   ```
   
   Replace `sk-ant-api03-YOUR-KEY-HERE` with your actual API key from step 1.

4. **Save the file** (Ctrl+O, Enter, Ctrl+X in nano)

⚠️ **Note:** The `.env` file is already in `.gitignore`, so your API key will NOT be committed to GitHub.

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

