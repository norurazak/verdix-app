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
            # --- THE DIGITAL CLOCK ---
            time_left = deadline - now
            days = time_left.days
            hours = time_left.seconds // 3600
            minutes = (time_left.seconds % 3600) // 60
            
            clock_html = f"""
            <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 30px;">
                <div style="background-color: #262730; padding: 15px 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 2.5rem; font-family: 'Courier New', monospace; font-weight: bold; color: #FEC30D; line-height: 1;">{days:02d}</div>
                    <div style="font-size: 0.75rem; color: #E0E0E0; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Days</div>
                </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #262730; display: flex; align-items: center; padding-bottom: 15px;">:</div>
                <div style="background-color: #262730; padding: 15px 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 2.5rem; font-family: 'Courier New', monospace; font-weight: bold; color: #FEC30D; line-height: 1;">{hours:02d}</div>
                    <div style="font-size: 0.75rem; color: #E0E0E0; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Hours</div>
                </div>
                <div style="font-size: 2.5rem; font-weight: bold; color: #262730; display: flex; align-items: center; padding-bottom: 15px;">:</div>
                <div style="background-color: #262730; padding: 15px 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="font-size: 2.5rem; font-family: 'Courier New', monospace; font-weight: bold; color: #FEC30D; line-height: 1;">{minutes:02d}</div>
                    <div style="font-size: 0.75rem; color: #E0E0E0; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Mins</div>
                </div>
            </div>
            """
            st.markdown(clock_html, unsafe_allow_html=True)
            
            # Fetch tracks from Config
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
        st.header("👩‍⚖️ Judge's Console")
        
        judge_name = st.text_input("Enter Judge Name", key="judge_login")
        
        if judge_name:
            # Fetch Config Data for Tracks & Venues
            config_data = ws_config.get_all_records()
            df_config = pd.DataFrame(config_data)
            
            if not df_config.empty:
                track_list = df_config['Track List'].tolist()
                selected_track = st.selectbox("Select Track to Judge", track_list)
                
                # Show Venue Info
                venue_info = df_config[df_config['Track List'] == selected_track]['Venue'].values
                if len(venue_info) > 0:
                    st.info(f"📍 Venue: **{venue_info[0]}**")
            else:
                st.error("No tracks configured in 'Config' tab.")
                st.stop()

            st.divider()

            # Fetch Teams
            teams_data = ws_teams.get_all_records()
            df_teams = pd.DataFrame(teams_data)
            
            if not df_teams.empty:
                # Filter teams by selected track
                track_teams = df_teams[df_teams['Track'] == selected_track]
                
                st.write(f"Showing **{len(track_teams)}** teams in {selected_track}")
                
                # Display Teams
                for index, row in track_teams.iterrows():
                    with st.expander(f"🎤 {row['Team Name']}", expanded=False):
                        st.subheader(row['Team Name'])
                        st.write(f"**Value Prop:** {row['Value Proposition']}")
                        if row['Link to Logo']:
                            st.markdown(f"[View Slides/Logo]({row['Link to Logo']})")
                        
                        st.markdown("---")
                        st.write("**📝 Score Card** (0-5 Scale)")
                        
                        # SCORING FORM - EXACT SEQUENCE
                        with st.form(f"score_{index}"):
                            # Row 1
                            c1, c2 = st.columns(2)
                            with c1: prob = st.slider("Problem Sol-Fit", 0, 5, 0)
                            with c2: comp = st.slider("Competitor Market", 0, 5, 0)
                            
                            # Row 2
                            c3, c4 = st.columns(2)
                            with c3: gtm = st.slider("GTM Strategy", 0, 5, 0)
                            with c4: innov = st.slider("Innovation", 0, 5, 0)
                            
                            # Row 3
                            c5, c6 = st.columns(2)
                            with c5: proto = st.slider("Prototype", 0, 5, 0)
                            with c6: rev = st.slider("Revenue Model", 0, 5, 0)
                            
                            # Row 4
                            story = st.slider("Story Telling", 0, 5, 0)
                            
                            comment = st.text_area("Comments (Optional)")
                            
                            submit_score = st.form_submit_button("Submit Score")
                            
                            if submit_score:
                                # SAVE TO GOOGLE SHEET - EXACT COLUMN ORDER
                                ws_scores.append_row([
                                    judge_name,           # A
                                    row['Team Name'],     # B
                                    selected_track,       # C
                                    prob,                 # D: Problem Sol-Fit
                                    comp,                 # E: Competitor Market
                                    gtm,                  # F: GTM Strategy
                                    innov,                # G: Innovation
                                    proto,                # H: Prototype
                                    rev,                  # I: Revenue Model
                                    story,                # J: Story Telling
                                    comment,              # K
                                    str(datetime.now())   # L
                                ])
                                st.toast(f"✅ Score saved for {row['Team Name']}!", icon="🎉")

   # ---------------------------
    # MODE 3: LEADERBOARD
    # ---------------------------
    elif menu == "Leaderboard":
        st.header("🏆 Live Results")
        password = st.text_input("Admin Password", type="password")
        
        if password == "admin123":
            scores_data = ws_scores.get_all_records()
            df_scores = pd.DataFrame(scores_data)
            
            if not df_scores.empty:
                # Calculate Total Raw Score (Sum of cols D-J)
                numeric_cols = ['Problem Sol-Fit', 'Competitor Market', 'GTM Strategy', 
                                'Innovation', 'Prototype', 'Revenue Model', 'Story Telling']
                
                # --- FIX: FORCE CONVERT TEXT TO NUMBERS ---
                for col in numeric_cols:
                    # Coerce errors will turn non-numbers into 0
                    df_scores[col] = pd.to_numeric(df_scores[col], errors='coerce').fillna(0)
                # ------------------------------------------

                # Create a Total column
                df_scores['Total Raw'] = df_scores[numeric_cols].sum(axis=1)
                
                # Group by Team to get average across judges
                leaderboard = df_scores.groupby('Team Name')[['Total Raw']].mean().reset_index()
                leaderboard = leaderboard.sort_values(by='Total Raw', ascending=False)
                
                # --- UPGRADE 1: DASHBOARD METRICS ---
                st.markdown("### 🌟 Current Standings")
                top_team = leaderboard.iloc[0]
                
                col1, col2, col3 = st.columns(3)
                col1.metric(label="🥇 1st Place", value=top_team['Team Name'])
                col2.metric(label="Highest Score", value=f"{top_team['Total Raw']:.2f} pts")
                col3.metric(label="Total Teams Judged", value=len(leaderboard))
                
                st.divider()
                
                # --- COLORFUL BAR CHART & HIDDEN TABLE ---
                st.bar_chart(leaderboard.set_index('Team Name')['Total Raw'], color="#FEC30D")
                
                with st.expander("📄 View Detailed Score Table"):
                    st.dataframe(leaderboard, hide_index=True, use_container_width=True)
            
            else:
                st.info("Waiting for the first scores to come in...")

if __name__ == "__main__":
    main()
