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
    st.set_page_config(page_title="Verdix", layout="centered")
    
    # --- PREMIUM DASHBOARD CSS INJECTION ---
    hide_st_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            header {visibility: hidden;}

            /* --- 1. PRIMARY BUTTONS (Submit, Login) --- */
            .stButton > button[kind="primary"] {
                background-color: #BF1A1A !important;
                border: 2px solid #BF1A1A !important;
                color: #FFFFFF !important;
                border-radius: 8px !important;
                font-weight: bold !important;
                padding: 0.5rem 1rem !important;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            }
            .stButton > button[kind="primary"]:hover {
                background-color: #0A0A0A !important; /* Deep Black Hover */
                color: #BF1A1A !important; /* Verdix Red Text */
                border: 2px solid #BF1A1A !important;
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(191, 26, 26, 0.4) !important; /* Red glow shadow */
            }

            /* --- 2. SECONDARY BUTTONS (Log Out) --- */
            .stButton > button[kind="secondary"] {
                background-color: transparent !important;
                border: 2px solid #333333 !important;
                color: #E0E0E0 !important;
                border-radius: 8px !important;
                font-weight: bold !important;
                transition: all 0.3s ease !important;
            }
            .stButton > button[kind="secondary"]:hover {
                border: 2px solid #BF1A1A !important;
                color: #BF1A1A !important;
                background-color: rgba(191, 26, 26, 0.05) !important;
            }

            /* --- 3. SIDEBAR NAVIGATION BARS --- */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label > div:first-child {
                display: none !important; /* Hides default circles */
            }
            
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label {
                background-color: #1A1A1A !important; /* Sleek Black */
                padding: 12px 15px !important;
                border-radius: 6px !important;
                margin-bottom: 8px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                border: 1px solid #333333 !important;
            }
            
            /* Force text inside the sidebar to be bright white */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label p {
                color: #FFFFFF !important;
                font-weight: 600 !important;
                margin: 0 !important;
            }
            
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label:hover {
                background-color: #BF1A1A !important;
                border-color: #BF1A1A !important;
                transform: translateX(4px);
                box-shadow: 0 4px 10px rgba(191, 26, 26, 0.3) !important;
            }
            
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label:has(input:checked) {
                background-color: #BF1A1A !important;
                border-color: #BF1A1A !important;
                box-shadow: 0 4px 12px rgba(191, 26, 26, 0.5) !important;
            }

            /* --- 4. DASHBOARD CARDS / CONTAINERS --- */
            [data-testid="stVerticalBlockBorderWrapper"] {
                background-color: #1E1E24 !important; /* Premium Dark Grey */
                border: 1px solid #333333 !important;
                border-radius: 12px !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2) !important;
            }
            
            /* --- 5. SLIDERS --- */
            .stSlider > div > div > div > div {
                background-color: #BF1A1A !important; /* Red Slider Track */
            }
            </style>
            """
    st.markdown(hide_st_style, unsafe_allow_html=True)
    # ----------------------------------

    st.sidebar.image("Verdix.png", use_container_width=True)
    
    st.title("Verdix")
    st.subheader("The Startup Scoring System")
    st.write("Verdix is a streamlined scoring platform designed to bring professional, VC-style evaluation to fast-paced pitch competitions, accelerators, and student venture showcases.")
    st.divider()

    try:
        sh = get_database()
        ws_teams = sh.worksheet("Teams")
        ws_scores = sh.worksheet("Scores")
        ws_config = sh.worksheet("Config")
    except Exception as e:
        st.error(f"Connection Error: {e}")
        st.stop()

    menu = st.sidebar.radio("Navigation", ["Student Registration", "Judge Portal", "Leaderboard"])

    # ---------------------------
    # MODE 1: STUDENT REGISTRATION
    # ---------------------------
    if menu == "Student Registration":
        
        st.markdown("<h1 style='text-align: center;'>🚀 Startup Registration</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #888888; font-size: 1.1rem;'>Build a compelling, investor-ready profile to unlock access to the pitching platform.</p>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        
        from datetime import datetime
        deadline = datetime(2026, 3, 15, 23, 59) 
        now = datetime.now()
        
        if now > deadline:
            st.error("🚨 Registration is officially closed.")
        else:
            # DIGITAL CLOCK
            import streamlit.components.v1 as components
            live_clock_html = """
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                body { margin: 0; font-family: sans-serif; background-color: transparent; display: flex; justify-content: center; }
                .container { display: flex; justify-content: center; gap: 15px; margin-top: 10px; margin-bottom: 20px;}
                .block { background-color: #1A1A1A; border: 1px solid #333; padding: 15px 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .num { font-size: 2.5rem; font-family: 'Courier New', monospace; font-weight: bold; color: #BF1A1A; line-height: 1; }
                .label { font-size: 0.75rem; color: #E0E0E0; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
                .colon { font-size: 2.5rem; font-weight: bold; color: #555555; display: flex; align-items: center; padding-bottom: 15px; }
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
                            document.querySelector('.container').innerHTML = "<div style='color: #BF1A1A; font-size: 1.5rem; font-weight: bold;'>TIME IS UP!</div>";
                        }
                    }, 1000);
                </script>
            </body>
            </html>
            """
            components.html(live_clock_html, height=120)
            
            config_data = ws_config.get_all_records()
            tracks = [row["Track Name"] for row in config_data if row.get("Track Name")]

            industry_dict = {
                "Agentic AI": "Autonomous agents and multi-step AI orchestration systems.",
                "SaaS (Enterprise)": "Cloud software and B2B digital transformation.",
                "HealthTech": "Telemedicine, digital diagnostics, and patient management.",
                "FinTech": "Payments, neobanks, and automated wealth management.",
                "EdTech": "Gamified learning, AI tutoring, and LMS platforms.",
                "E-commerce": "D2C infrastructure and omnichannel retail."
            }

            stage_dict = {
                "1. Concept & Ideation (Pre-Product)": "**VC Focus:** Founder brilliance, market size, and the 'Why Now?' factor.",
                "2. Prototype / Alpha (Proof of Concept)": "**VC Focus:** Technical feasibility and early design thinking.",
                "3. MVP & Pilot (Early Traction)": "**VC Focus:** User engagement, retention, and initial feedback loops.",
                "4. Scaling & Revenue (Growth Stage)": "**VC Focus:** Revenue growth, Customer Acquisition Cost (CAC), and Lifetime Value (LTV)."
            }
            
            submission_type = st.radio(
                "Submission Type", 
                ["🆕 New Registration", "🔄 Update Existing Registration"], 
                horizontal=True
            )

            # Dashboard Header Style Helper
            def dashboard_header(title, icon):
                return f"""
                <div style='background-color: #1A1A1A; border-left: 4px solid #BF1A1A; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px;'>
                    <h4 style='margin: 0; color: #FFFFFF; font-size: 1.1rem;'>{icon} {title}</h4>
                </div>
                """

            with st.container(border=True):
                st.markdown(dashboard_header("Team & Academic Details", "🎓"), unsafe_allow_html=True)
                col1, col2 = st.columns(2)
                with col1:
                    team_name = st.text_input("Startup / Team Name *")
                    track = st.selectbox("Which Track are you competing in? *", tracks)
                    team_leaders = st.text_area("Team Leaders (Names) *", placeholder="E.g., Alice (CEO), Bob (CTO)")
                    student_id = st.text_input("Student ID / IC No *")
                with col2:
                    university = st.text_input("University / Institution *", placeholder="E.g., Sunway University")
                    faculty = st.text_input("Faculty / School *")
                    programme = st.text_input("Academic Programme *")

            with st.container(border=True):
                st.markdown(dashboard_header("Venture Profile", "💼"), unsafe_allow_html=True)
                selected_industries = st.multiselect("Industry / Tags (Select up to 3) *", list(industry_dict.keys()))
                stage = st.selectbox("Stage of Startup *", [""] + list(stage_dict.keys()))
                value_prop = st.text_area("Value Proposition (The 'Elevator Pitch') *", height=100)
            
            with st.container(border=True):
                st.markdown(dashboard_header("Media & Links", "🔗"), unsafe_allow_html=True)
                video_link = st.text_input("Pitch Video Link (Optional)", placeholder="YouTube or Vimeo URL")
                deck_link = st.text_input("Pitch Deck / Logo Link *", placeholder="Google Drive or Canva URL")
            
            st.markdown("<br>", unsafe_allow_html=True)
            _, center_col, _ = st.columns([1, 2, 1])
            with center_col:
                submitted = st.button("🚀 Submit Registration", type="primary", use_container_width=True)
            
            if submitted:
                if not team_name or not track or not deck_link:
                    st.error("⚠️ Please fill in all required fields.")
                else:
                    industry_string = ", ".join(selected_industries)
                    timestamp = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                    
                    ws_teams.append_row([
                        timestamp, submission_type, team_name, track, team_leaders, student_id, 
                        university, faculty, programme, industry_string, stage, value_prop, video_link, deck_link
                    ])
                    st.success(f"✅ {team_name} successfully logged into Verdix database.")

    # ---------------------------
    # MODE 2: JUDGE PORTAL
    # ---------------------------
    elif menu == "Judge Portal":
        
        st.markdown("<h1 style='text-align: center;'>⚖️ Judge Portal</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #888888; font-size: 1.1rem;'>Review startup profiles and submit your official evaluations.</p>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        
        if "judge_logged_in" not in st.session_state:
            st.session_state.judge_logged_in = False
        if "current_judge_name" not in st.session_state:
            st.session_state.current_judge_name = ""

        # Helper for Dashboard Headers
        def dashboard_header(title, icon):
            return f"""
            <div style='background-color: #1A1A1A; border-left: 4px solid #BF1A1A; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px;'>
                <h4 style='margin: 0; color: #FFFFFF; font-size: 1.1rem;'>{icon} {title}</h4>
            </div>
            """

        if not st.session_state.judge_logged_in:
            with st.container(border=True):
                st.markdown(dashboard_header("Secure Access", "🔐"), unsafe_allow_html=True)
                judge_name_input = st.text_input("👨‍⚖️ Enter Your Full Name")
                judge_pass_input = st.text_input("🔑 Event Access Code", type="password")
                
                st.markdown("<br>", unsafe_allow_html=True)
                _, center_col, _ = st.columns([1, 2, 1])
                with center_col:
                    if st.button("Log In to Portal", type="primary", use_container_width=True):
                        if not judge_name_input:
                            st.error("⚠️ Please enter your name.")
                        elif judge_pass_input == "verdix2026":
                            st.session_state.judge_logged_in = True
                            st.session_state.current_judge_name = judge_name_input
                            st.rerun() 
                        else:
                            st.error("❌ Incorrect Access Code.")
        else:
            col_name, col_logout = st.columns([3, 1])
            with col_name:
                st.success(f"🟢 Secure Session Active: **{st.session_state.current_judge_name}**")
            with col_logout:
                if st.button("Log Out", type="secondary", use_container_width=True):
                    st.session_state.judge_logged_in = False
                    st.session_state.current_judge_name = ""
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)

            config_data = ws_config.get_all_records()
            tracks = [str(row["Track Name"]) for row in config_data if row.get("Track Name")]
            
            with st.container(border=True):
                st.markdown(dashboard_header("Target Startup & VC Profile", "🏢"), unsafe_allow_html=True)
                selected_track = st.selectbox("📌 Select Track", tracks)
                
                teams_data = ws_teams.get_all_records()
                if not teams_data:
                    st.warning("⚠️ No teams have registered yet.")
                else:
                    df_teams = pd.DataFrame(teams_data)
                    
                    if 'Track' in df_teams.columns:
                        track_teams = df_teams[df_teams['Track'] == selected_track]
                        
                        if not track_teams.empty:
                            team_list = track_teams['Team Name'].tolist()
                            selected_team = st.selectbox("🚀 Select Startup to Evaluate", team_list)
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
                            
            if 'track_teams' in locals() and not track_teams.empty:
                st.markdown("<br>", unsafe_allow_html=True)
                with st.container(border=True):
                    st.markdown(dashboard_header("Evaluation Rubric", "📊"), unsafe_allow_html=True)
                    
                    with st.form("scoring_form"):
                        st.caption("Score from 1 (Poor) to 10 (Excellent).")
                        score_1 = st.slider("1. Problem-Solution Fit", 1, 10, 5)
                        score_2 = st.slider("2. Competitor & Market Analysis", 1, 10, 5)
                        score_3 = st.slider("3. Go-to-Market (GTM) Strategy", 1, 10, 5)
                        score_4 = st.slider("4. Innovation / Differentiation", 1, 10, 5)
                        score_5 = st.slider("5. Prototype / MVP Readiness", 1, 10, 5)
                        score_6 = st.slider("6. Revenue Model / Financials", 1, 10, 5)
                        score_7 = st.slider("7. Storytelling & Pitch Delivery", 1, 10, 5)
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                        comments = st.text_area("Feedback / Comments (Optional)", placeholder="What did they do well? What critical areas need improvement?")
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                        submit_score = st.form_submit_button("✅ Submit Final Score", type="primary", use_container_width=True)
                        
                        if submit_score:
                            timestamp = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                            ws_scores.append_row([
                                timestamp, st.session_state.current_judge_name, selected_team, 
                                score_1, score_2, score_3, score_4, score_5, score_6, score_7, comments
                            ])
                            st.success(f"🎉 Evaluation securely logged for {selected_team}!")

    # ---------------------------
    # MODE 3: LEADERBOARD
    # ---------------------------
    elif menu == "Leaderboard":
        
        st.markdown("<h1 style='text-align: center;'>🏆 Live Leaderboard</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #888888; font-size: 1.1rem;'>Official startup rankings and aggregated judging scores.</p>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)

        def dashboard_header(title, icon):
            return f"""
            <div style='background-color: #1A1A1A; border-left: 4px solid #BF1A1A; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px;'>
                <h4 style='margin: 0; color: #FFFFFF; font-size: 1.1rem;'>{icon} {title}</h4>
            </div>
            """

        if "admin_logged_in" not in st.session_state:
            st.session_state.admin_logged_in = False

        if not st.session_state.admin_logged_in:
            with st.container(border=True):
                st.markdown(dashboard_header("Admin Access Required", "🔒"), unsafe_allow_html=True)
                admin_pass_input = st.text_input("🔑 Organizer Password", type="password")
                
                st.markdown("<br>", unsafe_allow_html=True)
                _, center_col, _ = st.columns([1, 2, 1])
                with center_col:
                    if st.button("Unlock Leaderboard", type="primary", use_container_width=True):
                        if admin_pass_input == "admin2026":
                            st.session_state.admin_logged_in = True
                            st.rerun()
                        else:
                            st.error("❌ Incorrect Password.")
                            
        else:
            col_title, col_logout = st.columns([3, 1])
            with col_title:
                st.success("🟢 Secure Admin Session Active")
            with col_logout:
                if st.button("🔒 Lock Dashboard", type="secondary", use_container_width=True):
                    st.session_state.admin_logged_in = False
                    st.rerun()

            st.markdown("<br>", unsafe_allow_html=True)
            scores_data = ws_scores.get_all_records()
            teams_data = ws_teams.get_all_records()

            if not scores_data:
                st.info("📊 No scores have been submitted yet.")
            else:
                df_scores = pd.DataFrame(scores_data)
                df_teams = pd.DataFrame(teams_data)

                track_dict = {}
                if not df_teams.empty and 'Team Name' in df_teams.columns and 'Track' in df_teams.columns:
                    track_dict = df_teams.drop_duplicates(subset=['Team Name'], keep='last').set_index('Team Name')['Track'].to_dict()

                score_cols = ['1. Problem-Solution Fit', '2. Competitor & Market Analysis', '3. Go-to-Market (GTM) Strategy', '4. Innovation / Differentiation', '5. Prototype / MVP Readiness', '6. Revenue Model / Financials', '7. Storytelling & Pitch Delivery']
                for col in score_cols:
                    if col in df_scores.columns:
                        df_scores[col] = pd.to_numeric(df_scores[col], errors='coerce').fillna(0)
                
                available_score_cols = [col for col in score_cols if col in df_scores.columns]
                df_scores['Total Score'] = df_scores[available_score_cols].sum(axis=1)

                if not track_dict:
                    df_scores['Track'] = "Unknown Track"
                else:
                    if 'Team Name' in df_scores.columns:
                        df_scores['Track'] = df_scores['Team Name'].map(track_dict).fillna("Unknown Track")
                    else:
                        df_scores['Track'] = "Unknown Track"

                config_data = ws_config.get_all_records()
                tracks = ["All Tracks"] + [str(row["Track Name"]) for row in config_data if row.get("Track Name")]

                with st.container(border=True):
                    st.markdown(dashboard_header("Filter Results", "🏆"), unsafe_allow_html=True)
                    selected_view = st.selectbox("View Leaderboard For:", tracks)

                if 'Team Name' in df_scores.columns:
                    leaderboard = df_scores.groupby(['Team Name', 'Track']).agg(
                        Average_Score=('Total Score', 'mean'),
                        Judges_Count=('Judge Name', 'nunique') if 'Judge Name' in df_scores.columns else ('Total Score', 'count')
                    ).reset_index()

                    leaderboard['Average_Score'] = leaderboard['Average_Score'].round(2)
                    if selected_view != "All Tracks":
                        leaderboard = leaderboard[leaderboard['Track'] == selected_view]
                    leaderboard = leaderboard.sort_values(by='Average_Score', ascending=False).reset_index(drop=True)

                    if leaderboard.empty:
                        st.warning(f"No scores available for {selected_view} yet.")
                    else:
                        leaderboard.index = leaderboard.index + 1
                        leaderboard = leaderboard.rename(columns={'Team Name': 'Startup / Team', 'Average_Score': 'Avg. Score (Out of 70)', 'Judges_Count': '# of Judges'})

                        st.markdown("<br>", unsafe_allow_html=True)
                        with st.container(border=True):
                            st.markdown(f"<div style='background-color: #BF1A1A; color: #FFFFFF; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>Top Rankings: {selected_view}</div>", unsafe_allow_html=True)

                            if len(leaderboard) >= 1: st.success(f"🥇 **1st Place:** {leaderboard.iloc[0]['Startup / Team']} — **{leaderboard.iloc[0]['Avg. Score (Out of 70)']} pts**")
                            if len(leaderboard) >= 2: st.info(f"🥈 **2nd Place:** {leaderboard.iloc[1]['Startup / Team']} — **{leaderboard.iloc[1]['Avg. Score (Out of 70)']} pts**")
                            if len(leaderboard) >= 3: st.warning(f"🥉 **3rd Place:** {leaderboard.iloc[2]['Startup / Team']} — **{leaderboard.iloc[2]['Avg. Score (Out of 70)']} pts**")

                            st.markdown("<br>", unsafe_allow_html=True)
                            st.dataframe(leaderboard, use_container_width=True)

                            with st.expander("🔍 View Detailed Feedback & Individual Scores"):
                                desired_cols = ['Timestamp', 'Judge Name', 'Team Name', 'Track', 'Total Score', 'Feedback / Comments']
                                safe_cols = [col for col in desired_cols if col in df_scores.columns]
                                if safe_cols:
                                    st.dataframe(df_scores[safe_cols].sort_values(by='Timestamp', ascending=False) if 'Timestamp' in safe_cols else df_scores[safe_cols], use_container_width=True)

if __name__ == "__main__":
    main()
