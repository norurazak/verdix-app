import streamlit as st
import pandas as pd
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# --- CONFIGURATION ---
SCOPE = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
SHEET_NAME = "Verdix_DB"

# --- AUTHENTICATION ---
@st.cache_resource
def get_database():
    # Load credentials from Streamlit Secrets
    if "gcp_service_account" not in st.secrets:
        st.error("Secrets not found! Please add your JSON key to Streamlit Secrets.")
        st.stop()
    
    # CONVERT TO DICT AND REPAIR THE KEY
    creds_dict = dict(st.secrets["gcp_service_account"])
    
    # This line fixes the formatting error automatically:
    creds_dict["private_key"] = creds_dict["private_key"].replace("\\n", "\n")
    
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
    client = gspread.authorize(creds)
    return client.open(SHEET_NAME)

# --- MAIN APP ---
def main():
    # Removed the scale icon from the browser tab
    st.set_page_config(page_title="Verdix", layout="centered")
    
    # --- UX HIDE STREAMLIT BRANDING ---
    hide_st_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            header {visibility: hidden;}
            </style>
            """
    st.markdown(hide_st_style, unsafe_allow_html=True)
    # ----------------------------------

    st.sidebar.image("Verdix.png", use_container_width=True)
    
    # --- NEW TITLE & VC-STYLE DESCRIPTION ---
    st.title("Verdix")
    st.subheader("The Startup Scoring System")
    st.write("Verdix is a streamlined scoring platform designed to bring professional, VC-style evaluation to fast-paced pitch competitions, accelerators, and student venture showcases.")
    st.divider() # Adds a clean visual line under the description

    # Connect to Google Sheet
    try:
        sh = get_database()
        ws_teams = sh.worksheet("Teams")
        ws_scores = sh.worksheet("Scores")
        ws_config = sh.worksheet("Config")
    except Exception as e:
        st.error(f"Connection Error: {e}")
        st.stop()

    # Sidebar Navigation
    menu = st.sidebar.radio("Navigation", ["Student Registration", "Judge Portal", "Leaderboard"])

    # ---------------------------
    # MODE 1: STUDENT REGISTRATION
    # ---------------------------
    if menu == "Student Registration":
        
        # --- HERO SECTION ---
        st.markdown("<h1 style='text-align: center;'>🚀 Startup Registration</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #555555; font-size: 1.1rem;'>Build a compelling, investor-ready profile to unlock access to the pitching platform. Share your vision, traction, team, and growth strategy in a format designed to match VC expectations.</p>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        
        from datetime import datetime
        deadline = datetime(2026, 3, 15, 23, 59) 
        now = datetime.now()
        
        if now > deadline:
            st.error("🚨 Registration is officially closed.")
        else:
            # --- THE LIVE TICKING DIGITAL CLOCK (JS INJECTION) ---
            import streamlit.components.v1 as components
            
            # We use pure HTML/JS so it ticks in the browser without erasing Streamlit form data
            live_clock_html = """
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                body { margin: 0; font-family: sans-serif; background-color: transparent; display: flex; justify-content: center; }
                .container { display: flex; justify-content: center; gap: 15px; margin-top: 10px; margin-bottom: 20px;}
                .block { background-color: #262730; padding: 15px 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .num { font-size: 2.5rem; font-family: 'Courier New', monospace; font-weight: bold; color: #FEC30D; line-height: 1; }
                .label { font-size: 0.75rem; color: #E0E0E0; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
                .colon { font-size: 2.5rem; font-weight: bold; color: #262730; display: flex; align-items: center; padding-bottom: 15px; }
            </style>
            </head>
            <body>
                <div class="container">
                    <div class="block"><div class="num" id="days">00</div><div class="label">Days</div></div>
                    <div class="colon">:</div>
                    <div class="block"><div class="num" id="hours">00</div><div class="label">Hours</div></div>
                    <div class="colon">:</div>
                    <div class="block"><div class="num" id="minutes">00</div><div class="label">Mins</div></div>
                    <div class="colon">:</div>
                    <div class="block"><div class="num" id="seconds">00</div><div class="label">Secs</div></div>
                </div>

                <script>
                    // Set your exact deadline here! (Month DD, YYYY HH:MM:SS)
                    var deadline = new Date("Mar 15, 2026 23:59:00").getTime();
                    
                    var x = setInterval(function() {
                        var now = new Date().getTime();
                        var t = deadline - now;
                        
                        if (t >= 0) {
                            document.getElementById("days").innerHTML = Math.floor(t / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
                            document.getElementById("hours").innerHTML = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
                            document.getElementById("minutes").innerHTML = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                            document.getElementById("seconds").innerHTML = Math.floor((t % (1000 * 60)) / 1000).toString().padStart(2, '0');
                        } else {
                            clearInterval(x);
                            document.querySelector('.container').innerHTML = "<div style='color: red; font-size: 1.5rem; font-weight: bold;'>TIME IS UP!</div>";
                        }
                    }, 1000);
                </script>
            </body>
            </html>
            """
            components.html(live_clock_html, height=120)
            # ----------------------------------------------------
            
            # Fetch tracks from Config (Make sure your Config tab has exactly "Track Name" in row 1!)
            config_data = ws_config.get_all_records()
            tracks = [row["Track Name"] for row in config_data if row.get("Track Name")]

            # --- DICTIONARIES ---
            industry_dict = {
                "Agentic AI": "Autonomous agents and multi-step AI orchestration systems.",
                "GenAI & LLMs": "Creative tools, text generation, and model infrastructure.",
                "SaaS (Enterprise)": "Cloud software and B2B digital transformation.",
                "Cybersecurity": "Data privacy, threat detection, and zero-trust systems.",
                "Deep Tech": "Quantum computing, advanced materials, and semiconductors.",
                "Web3 & Blockchain": "DeFi, digital assets, and decentralized infra.",
                "CloudTech & DevOps": "Server management, scaling tools, and developer platforms.",
                "HealthTech": "Telemedicine, digital diagnostics, and patient management.",
                "BioTech": "Drug discovery, genomics, and lab-grown alternatives.",
                "MedTech": "Medical hardware, robotics for surgery, and wearable devices.",
                "FemTech": "Women’s health, reproductive tech, and menopause support.",
                "Longevity & Aging": "Tech for elder care and life-extension science.",
                "Wellness & Mental Health": "Mindfulness apps and AI-assisted therapy.",
                "ClimateTech": "Carbon capture, ESG reporting, and circular economy tools.",
                "CleanTech": "Renewable energy (Solar, Wind, Fusion) and grid storage.",
                "AgTech": "Precision farming, vertical agriculture, and soil health.",
                "FoodTech": "Synthetic proteins, food waste reduction, and nutrition AI.",
                "Mobility & EV": "Electric vehicles, charging networks, and battery tech.",
                "Logistics & Supply Chain": "Autonomous shipping and last-mile delivery.",
                "SpaceTech": "Orbital logistics, satellite data, and space exploration.",
                "PropTech & Construction": "Smart buildings and digital real estate management.",
                "FinTech": "Payments, neobanks, and automated wealth management.",
                "InsurTech": "Digital underwriting and risk assessment platforms.",
                "EdTech": "Gamified learning, AI tutoring, and LMS platforms.",
                "GovTech": "Citizen services and public sector efficiency software.",
                "DefenseTech": "National security tech, drones, and tactical software.",
                "Retail & E-commerce": "D2C infrastructure and omnichannel retail.",
                "Creator Economy": "Monetization tools and influencer marketing platforms.",
                "Gaming & Metaverse": "VR/AR, eSports, and interactive entertainment.",
                "AdTech & MarTech": "AI-driven marketing and customer acquisition."
            }

            stage_dict = {
                "1. Concept & Ideation (Pre-Product)": "**VC Focus:** Founder brilliance, market size, and the 'Why Now?' factor.\n\n**Description:** The team has identified a major problem and a theoretical solution. There is no working software or hardware yet. (Deliverable: Pitch deck and market research).",
                "2. Prototype / Alpha (Proof of Concept)": "**VC Focus:** Technical feasibility and early design thinking.\n\n**Description:** A 'low-fidelity' version of the product exists. It proves the core technology or service is possible. (Deliverable: Demo or clickable wireframes).",
                "3. MVP & Pilot (Early Traction)": "**VC Focus:** User engagement, retention, and initial feedback loops.\n\n**Description:** The Minimum Viable Product is live and in the hands of actual users. The team is currently testing for 'Product-Market Fit.' (Deliverable: Usage data or LOIs).",
                "4. Scaling & Revenue (Growth Stage)": "**VC Focus:** Revenue growth, Customer Acquisition Cost (CAC), and Lifetime Value (LTV).\n\n**Description:** The product is being sold. The startup has a repeatable process for acquiring customers. (Deliverable: Financial statements and growth charts)."
            }
            
            # --- HORIZONTAL RADIO BUTTON ---
            submission_type = st.radio(
                "Submission Type", 
                ["🆕 New Registration", "🔄 Update Existing Registration"], 
                horizontal=True,
                help="If you are updating, make sure to use your exact Team Name so we can replace your old entry."
            )

            # --- CARD 1: TEAM DETAILS ---
            with st.container(border=True):
                st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>Team & Academic Details</div>", unsafe_allow_html=True)
                
                col1, col2 = st.columns(2)
                with col1:
                    team_name = st.text_input("Startup / Team Name *")
                    track = st.selectbox("Which Track are you competing in? *", tracks)
                    team_leaders = st.text_area("Team Leaders (Names) *", placeholder="E.g., Alice (CEO), Bob (CTO)")
                    student_id = st.text_input("Student ID / IC No *", placeholder="E.g., 12345678 or 010203-14-5555")
                with col2:
                    university = st.text_input("University / Institution *", placeholder="E.g., Sunway University")
                    faculty = st.text_input("Faculty / School *", placeholder="E.g., School of Science and Technology")
                    programme = st.text_input("Academic Programme *", placeholder="E.g., BSc Computer Science")

            # --- CARD 2: VENTURE PROFILE ---
            with st.container(border=True):
                st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>Venture Profile</div>", unsafe_allow_html=True)
                
                selected_industries = st.multiselect("Industry / Tags (Select up to 3) *", list(industry_dict.keys()))
                if selected_industries:
                    for ind in selected_industries:
                        st.caption(f"🔹 **{ind}**: {industry_dict[ind]}")
                
                st.markdown("<br>", unsafe_allow_html=True)
                
                stage = st.selectbox("Stage of Startup *", [""] + list(stage_dict.keys()))
                if stage:
                    st.info(stage_dict[stage])
                
                value_prop = st.text_area(
                    "Value Proposition (The 'Elevator Pitch') *", 
                    placeholder="What problem are you solving, and how?",
                    height=150
                )
            
            # --- CARD 3: MEDIA & LINKS ---
            with st.container(border=True):
                st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>Media & Links</div>", unsafe_allow_html=True)
                
                st.info("💡 **Security Check:** Please ensure all Google Drive or Canva links are set to 'Anyone with the link can view' before submitting.")
                
                video_link = st.text_input("Pitch Video Link (Optional)", placeholder="YouTube or Vimeo URL")
                deck_link = st.text_input("Pitch Deck / Logo Link *", placeholder="Google Drive, Canva, or Dropbox URL")
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # --- SUBMISSION ACTION ---
            _, center_col, _ = st.columns([1, 2, 1])
            with center_col:
                submitted = st.button("🚀 Submit Registration", type="primary", use_container_width=True)
            
            if submitted:
                # --- SMART VALIDATION ---
                missing_fields = []
                
                if not team_name: missing_fields.append("Startup / Team Name")
                if not track: missing_fields.append("Track")
                if not team_leaders: missing_fields.append("Team Leaders")
                if not student_id: missing_fields.append("Student ID / IC No")
                if not university: missing_fields.append("University / Institution")
                if not faculty: missing_fields.append("Faculty / School")
                if not programme: missing_fields.append("Academic Programme")
                if not selected_industries: missing_fields.append("Industry / Tags")
                if not stage: missing_fields.append("Stage of Startup")
                if not value_prop: missing_fields.append("Value Proposition")
                if not deck_link: missing_fields.append("Pitch Deck / Logo Link")
                
                # If the list has anything in it, show the specific error
                if missing_fields:
                    missing_str = ", ".join(missing_fields)
                    st.error(f"⚠️ Please fill in the missing fields: **{missing_str}**")
                else:
                    # If everything is filled out, save to database
                    industry_string = ", ".join(selected_industries)
                    timestamp = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                    
                    # APPEND 14 COLUMNS TO GOOGLE SHEETS
                    ws_teams.append_row([
                        timestamp,         # Col A
                        submission_type,   # Col B
                        team_name,         # Col C
                        track,             # Col D
                        team_leaders,      # Col E
                        student_id,        # Col F 
                        university,        # Col G
                        faculty,           # Col H
                        programme,         # Col I
                        industry_string,   # Col J
                        stage,             # Col K
                        value_prop,        # Col L
                        video_link,        # Col M
                        deck_link          # Col N
                    ])
                    
                    if "Update" in submission_type:
                        st.success(f"✅ {team_name}'s profile has been securely updated in the Verdix system.")
                    else:
                        st.success(f"✅ {team_name} successfully registered.")
                        st.info("Your investor profile has been securely logged. The judging panel will review your materials shortly.")

    # ---------------------------
    # MODE 2: JUDGE PORTAL
    # ---------------------------
    elif menu == "Judge Portal":
        
        # --- HERO SECTION ---
        st.markdown("<h1 style='text-align: center;'>⚖️ Judge Portal</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #555555; font-size: 1.1rem;'>Review startup profiles and submit your official evaluations.</p>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        
        # --- SESSION STATE (Memory) ---
        if "judge_logged_in" not in st.session_state:
            st.session_state.judge_logged_in = False
        if "current_judge_name" not in st.session_state:
            st.session_state.current_judge_name = ""

        # --- LOGIN SCREEN ---
        if not st.session_state.judge_logged_in:
            with st.container(border=True):
                st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>🔐 Secure Login</div>", unsafe_allow_html=True)
                
                judge_name_input = st.text_input("👨‍⚖️ Enter Your Full Name")
                judge_pass_input = st.text_input("🔑 Event Access Code", type="password", help="Enter the shared event password provided by the organizers.")
                
                st.markdown("<br>", unsafe_allow_html=True)
                _, center_col, _ = st.columns([1, 2, 1])
                with center_col:
                    if st.button("Log In to Portal", type="primary", use_container_width=True):
                        if not judge_name_input:
                            st.error("⚠️ Please enter your name so we can record your scores.")
                        elif judge_pass_input == "verdix2026":  # <--- CHANGE YOUR PASSWORD HERE
                            st.session_state.judge_logged_in = True
                            st.session_state.current_judge_name = judge_name_input
                            st.rerun() 
                        else:
                            st.error("❌ Incorrect Access Code.")
        
        # --- THE SECURE PORTAL (Only visible if logged in) ---
        else:
            # Header with Logout
            col_name, col_logout = st.columns([3, 1])
            with col_name:
                st.success(f"✅ Secure Session Active: **{st.session_state.current_judge_name}**")
            with col_logout:
                if st.button("Log Out", use_container_width=True):
                    st.session_state.judge_logged_in = False
                    st.session_state.current_judge_name = ""
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)

            # Fetch Tracks using the new "Track Name" header
            config_data = ws_config.get_all_records()
            tracks = [str(row["Track Name"]) for row in config_data if row.get("Track Name")]
            
            # --- CARD 1: TEAM SELECTION ---
            with st.container(border=True):
                st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>Startup Selection</div>", unsafe_allow_html=True)
                
                selected_track = st.selectbox("📌 Select Track", tracks)
                
                # Fetch Teams Database
                teams_data = ws_teams.get_all_records()
                if not teams_data:
                    st.warning("⚠️ No teams have registered yet.")
                else:
                    import pandas as pd
                    df_teams = pd.DataFrame(teams_data)
                    
                    if 'Track' not in df_teams.columns:
                        st.info("Waiting for the first team to register to build the database format.")
                    else:
                        track_teams = df_teams[df_teams['Track'] == selected_track]
                        
                        if track_teams.empty:
                            st.info(f"No teams found in the {selected_track} track yet.")
                        else:
                            team_list = track_teams['Team Name'].tolist()
                            selected_team = st.selectbox("🚀 Select Startup to Evaluate", team_list)
                            
                            # --- PULL THE VC PROFILE ---
                            team_info = track_teams[track_teams['Team Name'] == selected_team].iloc[-1] 
                            
                            st.markdown("<br>", unsafe_allow_html=True)
                            with st.expander(f"📄 View {selected_team}'s Investor Profile", expanded=True):
                                st.markdown(f"**💡 Value Proposition:** {team_info.get('Value Proposition', 'N/A')}")
                                st.markdown(f"**🏷️ Industry / Tags:** {team_info.get('Industry / Tags', 'N/A')}")
                                st.markdown(f"**📈 Current Stage:** {team_info.get('Stage of Startup', 'N/A')}")
                                st.markdown("---")
                                st.markdown(f"**👥 Founders:** {team_info.get('Team Leaders (Names)', 'N/A')}")
                                st.markdown(f"**🎓 Academic Background:** {team_info.get('University / Institution', 'N/A')} - {team_info.get('Faculty / School', 'N/A')}")
                                
                                st.markdown("<br>", unsafe_allow_html=True)
                                col_link1, col_link2 = st.columns(2)
                                deck_link = team_info.get('Pitch Deck / Logo Link', '')
                                video_link = team_info.get('Pitch Video Link', '')
                                
                                with col_link1:
                                    if deck_link: st.markdown(f"[🔗 Open Pitch Deck]({deck_link})")
                                with col_link2:
                                    if video_link: st.markdown(f"[🎥 Open Pitch Video]({video_link})")
                            
            # --- CARD 2: SCORING FORM ---
            if 'track_teams' in locals() and not track_teams.empty:
                st.markdown("<br>", unsafe_allow_html=True)
                with st.container(border=True):
                    st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>Evaluation Rubric</div>", unsafe_allow_html=True)
                    
                    from datetime import datetime
                    with st.form("scoring_form"):
                        st.info("💡 **Hover over the (?) icon next to each criterion for the detailed scoring definition.** Score from 1 (Poor) to 10 (Excellent).")
                        
                        score_1 = st.slider("1. Problem-Solution Fit", 1, 10, 5, help="Does the proposed solution effectively address a clearly defined, highly painful, and significant market problem?")
                        score_2 = st.slider("2. Competitor & Market Analysis", 1, 10, 5, help="Demonstrates a deep understanding of the competitive landscape, target market size (TAM/SAM/SOM), and possesses a clear unfair advantage.")
                        score_3 = st.slider("3. Go-to-Market (GTM) Strategy", 1, 10, 5, help="Feasibility, clarity, and cost-effectiveness of their customer acquisition strategy and intended distribution channels.")
                        score_4 = st.slider("4. Innovation / Differentiation", 1, 10, 5, help="Uniqueness of the core technology, product design, or business model. Is it defensible against copycats?")
                        score_5 = st.slider("5. Prototype / MVP Readiness", 1, 10, 5, help="Current state of product development, technical feasibility, and evidence of early user feedback or traction.")
                        score_6 = st.slider("6. Revenue Model / Financials", 1, 10, 5, help="Clarity and realism of the monetization strategy, pricing model, unit economics, and projected path to profitability.")
                        score_7 = st.slider("7. Storytelling & Pitch Delivery", 1, 10, 5, help="Clarity, confidence, and persuasiveness of the presentation. Do the founders exhibit strong domain expertise and passion?")
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                        comments = st.text_area("Feedback / Comments (Optional)", placeholder="What did they do well? What critical areas need improvement?")
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                        submit_score = st.form_submit_button("✅ Submit Final Score", type="primary", use_container_width=True)
                        
                        if submit_score:
                            timestamp = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                            
                            # Append to Scores Worksheet
                            ws_scores.append_row([
                                timestamp,         # Col A
                                st.session_state.current_judge_name, # Col B
                                selected_team,     # Col C
                                score_1,           # Col D
                                score_2,           # Col E
                                score_3,           # Col F
                                score_4,           # Col G
                                score_5,           # Col H
                                score_6,           # Col I
                                score_7,           # Col J
                                comments           # Col K
                            ])
                            st.success(f"🎉 Evaluation securely logged for {selected_team}! You may now select another startup.")

    # ---------------------------
    # MODE 3: LEADERBOARD
    # ---------------------------
    elif menu == "Leaderboard":
        
        # --- HERO SECTION ---
        st.markdown("<h1 style='text-align: center;'>🏆 Live Leaderboard</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #555555; font-size: 1.1rem;'>Official startup rankings and aggregated judging scores.</p>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)

        # --- SESSION STATE (Memory) ---
        if "admin_logged_in" not in st.session_state:
            st.session_state.admin_logged_in = False

        # --- ADMIN LOGIN SCREEN ---
        if not st.session_state.admin_logged_in:
            with st.container(border=True):
                st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>🔒 Admin Access Required</div>", unsafe_allow_html=True)
                
                admin_pass_input = st.text_input("🔑 Organizer Password", type="password", help="Enter the master password to view live scores.")
                
                st.markdown("<br>", unsafe_allow_html=True)
                _, center_col, _ = st.columns([1, 2, 1])
                with center_col:
                    if st.button("Unlock Leaderboard", type="primary", use_container_width=True):
                        if admin_pass_input == "admin2026": # <--- CHANGE ADMIN PASSWORD HERE
                            st.session_state.admin_logged_in = True
                            st.rerun()
                        else:
                            st.error("❌ Incorrect Password.")
                            
        # --- THE SECURE LEADERBOARD PORTAL ---
        else:
            # Header with Logout
            col_title, col_logout = st.columns([3, 1])
            with col_title:
                st.success("✅ Secure Admin Session Active")
            with col_logout:
                if st.button("🔒 Lock Dashboard", use_container_width=True):
                    st.session_state.admin_logged_in = False
                    st.rerun()

            st.markdown("<br>", unsafe_allow_html=True)

            # Fetch Data from both sheets
            scores_data = ws_scores.get_all_records()
            teams_data = ws_teams.get_all_records()

            if not scores_data:
                st.info("📊 No scores have been submitted yet. Waiting for judges...")
            else:
                import pandas as pd
                df_scores = pd.DataFrame(scores_data)
                df_teams = pd.DataFrame(teams_data)

                # Step 1: Create a map to link Teams to their Tracks
                track_dict = {}
                if not df_teams.empty and 'Team Name' in df_teams.columns and 'Track' in df_teams.columns:
                    # If a team updated their form, keep the newest track info
                    track_dict = df_teams.drop_duplicates(subset=['Team Name'], keep='last').set_index('Team Name')['Track'].to_dict()

                # Step 2: Clean and Calculate the Scores
                score_cols = [
                    '1. Problem-Solution Fit', '2. Competitor & Market Analysis',
                    '3. Go-to-Market (GTM) Strategy', '4. Innovation / Differentiation',
                    '5. Prototype / MVP Readiness', '6. Revenue Model / Financials',
                    '7. Storytelling & Pitch Delivery'
                ]

                # Convert all scores to numbers (just in case) and sum them up out of 70
                for col in score_cols:
                    if col in df_scores.columns:
                        df_scores[col] = pd.to_numeric(df_scores[col], errors='coerce').fillna(0)
                
                available_score_cols = [col for col in score_cols if col in df_scores.columns]
                df_scores['Total Score'] = df_scores[available_score_cols].sum(axis=1)

                # Attach the track to each score safely
                if not track_dict:
                    df_scores['Track'] = "Unknown Track"
                else:
                    if 'Team Name' in df_scores.columns:
                        df_scores['Track'] = df_scores['Team Name'].map(track_dict).fillna("Unknown Track")
                    else:
                        df_scores['Track'] = "Unknown Track"

                # --- UI: FILTER BY TRACK ---
                config_data = ws_config.get_all_records()
                tracks = ["All Tracks"] + [str(row["Track Name"]) for row in config_data if row.get("Track Name")]

                with st.container(border=True):
                    st.markdown("<div style='background-color: #262730; color: white; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.1rem; margin-bottom: 15px;'>Filter Results</div>", unsafe_allow_html=True)
                    selected_view = st.selectbox("🏆 View Leaderboard For:", tracks)

                # Step 3: Aggregate Scores (Average the Total Score if multiple judges scored)
                if 'Team Name' in df_scores.columns:
                    leaderboard = df_scores.groupby(['Team Name', 'Track']).agg(
                        Average_Score=('Total Score', 'mean'),
                        Judges_Count=('Judge Name', 'nunique') if 'Judge Name' in df_scores.columns else ('Total Score', 'count')
                    ).reset_index()

                    leaderboard['Average_Score'] = leaderboard['Average_Score'].round(2)

                    # Apply the user's filter
                    if selected_view != "All Tracks":
                        leaderboard = leaderboard[leaderboard['Track'] == selected_view]

                    # Sort Highest to Lowest
                    leaderboard = leaderboard.sort_values(by='Average_Score', ascending=False).reset_index(drop=True)

                    # --- UI: DISPLAY RESULTS ---
                    if leaderboard.empty:
                        st.warning(f"No scores available for {selected_view} yet.")
                    else:
                        # Format for Streamlit table
                        leaderboard.index = leaderboard.index + 1 # Start rank at 1, not 0
                        leaderboard = leaderboard.rename(columns={
                            'Team Name': 'Startup / Team',
                            'Average_Score': 'Avg. Score (Out of 70)',
                            'Judges_Count': '# of Judges'
                        })

                        st.markdown("<br>", unsafe_allow_html=True)
                        with st.container(border=True):
                            # iLabs Gold Banner for the Winners Podium
                            st.markdown(f"<div style='background-color: #FEC30D; color: #31333F; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>Top Rankings: {selected_view}</div>", unsafe_allow_html=True)

                            # Highlight Top 3 Podium
                            if len(leaderboard) >= 1:
                                st.success(f"🥇 **1st Place:** {leaderboard.iloc[0]['Startup / Team']} — **{leaderboard.iloc[0]['Avg. Score (Out of 70)']} pts**")
                            if len(leaderboard) >= 2:
                                st.info(f"🥈 **2nd Place:** {leaderboard.iloc[1]['Startup / Team']} — **{leaderboard.iloc[1]['Avg. Score (Out of 70)']} pts**")
                            if len(leaderboard) >= 3:
                                st.warning(f"🥉 **3rd Place:** {leaderboard.iloc[2]['Startup / Team']} — **{leaderboard.iloc[2]['Avg. Score (Out of 70)']} pts**")

                            st.markdown("<br>", unsafe_allow_html=True)
                            st.dataframe(leaderboard, use_container_width=True)

                            # Detailed Judge Breakdown
                            with st.expander("🔍 View Detailed Feedback & Individual Scores"):
                                st.markdown("Use this raw data to see exactly who scored what, and read the judges' individual feedback.")
                                
                                # SAFETY FIX: Only try to display columns that actually exist!
                                desired_cols = ['Timestamp', 'Judge Name', 'Team Name', 'Track', 'Total Score', 'Feedback / Comments']
                                safe_cols = [col for col in desired_cols if col in df_scores.columns]
                                
                                if safe_cols:
                                    # Sort by Timestamp if it exists
                                    if 'Timestamp' in safe_cols:
                                        raw_display = df_scores[safe_cols].sort_values(by='Timestamp', ascending=False)
                                    else:
                                        raw_display = df_scores[safe_cols]
                                    
                                    st.dataframe(raw_display, use_container_width=True)
                                else:
                                    st.error("⚠️ Database header mismatch. Please check Row 1 of your Scores Google Sheet.")
                else:
                    st.error("⚠️ Column 'Team Name' is missing from your Scores sheet. Please fix Row 1 in Google Sheets.")

# --- THE ENGINE STARTER ---
# This block is absolutely critical to make the app run!
if __name__ == "__main__":
    main()
