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
    if "gcp_service_account" not in st.secrets:
        st.error("Secrets not found! Please add your JSON key to Streamlit Secrets.")
        st.stop()
    
    creds_dict = dict(st.secrets["gcp_service_account"])
    creds_dict["private_key"] = creds_dict["private_key"].replace("\\n", "\n")
    
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
    client = gspread.authorize(creds)
    return client.open(SHEET_NAME)

# --- VERDIX CUSTOM UI/UX THEME (Street Market Warmth) ---
def apply_verdix_theme():
    custom_css = """
    <style>
        /* Hide Default Streamlit Branding */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}

        /* Global Background: Asphalt Deep */
        .stApp {
            background-color: #0D101A;
            color: #DDD3CC;
        }

        /* Text: Warm Concrete */
        h1, h2, h3, h4, p, label, span, div {
            color: #DDD3CC !important;
        }

        /* Highlight Accents for specific text */
        .saffron-red { color: #BF4343; font-weight: bold; }
        .taro-leaf { color: #6F7FB7; font-weight: bold; }
        .market-green { color: #B9C46D; font-weight: bold; }

        /* Container/Cards: Charcoal Grill + Magnetic Hover Effect */
        [data-testid="stVerticalBlockBorderWrapper"] {
            background-color: #262B34 !important;
            border-radius: 16px !important;
            border: 1px solid rgba(111, 127, 183, 0.2) !important; /* Taro Leaf subtle border */
            padding: 1rem;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        [data-testid="stVerticalBlockBorderWrapper"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(219, 168, 168, 0.4) !important; /* Pink Stucco glow */
        }

        /* Primary Buttons: Saffron Red */
        .stButton > button[kind="primary"] {
            background-color: #BF4343 !important;
            color: #ffffff !important;
            border-radius: 12px !important;
            border: none !important;
            font-weight: bold !important;
            transition: all 0.3s ease !important;
        }
        /* Magnetic HUD Button Hover */
        .stButton > button[kind="primary"]:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 15px rgba(191, 67, 67, 0.4);
        }

        /* Secondary Buttons: Transparent with Taro Leaf Border */
        .stButton > button[kind="secondary"] {
            background-color: transparent !important;
            color: #DBA8A8 !important; /* Pink Stucco */
            border: 1px solid #6F7FB7 !important;
            border-radius: 12px !important;
            transition: all 0.3s ease !important;
        }
        .stButton > button[kind="secondary"]:hover {
            background-color: rgba(111, 127, 183, 0.1) !important;
            transform: translateY(-1px);
        }

        /* Input Fields: Seamless blend */
        .stTextInput>div>div>input, .stSelectbox>div>div>select, .stTextArea>div>div>textarea {
            background-color: #0D101A !important;
            color: #DDD3CC !important;
            border: 1px solid #6F7FB7 !important; /* Taro Leaf */
            border-radius: 8px !important;
        }
        .stTextInput>div>div>input:focus, .stSelectbox>div>div>select:focus, .stTextArea>div>div>textarea:focus {
            border-color: #DBA8A8 !important; /* Pink Stucco focus */
            box-shadow: 0 0 0 1px #DBA8A8 !important;
        }

        /* Sliders: Pink Stucco Track */
        .stSlider > div > div > div > div {
            background-color: #DBA8A8 !important; 
        }

        /* Expanders */
        .streamlit-expanderHeader {
            background-color: #262B34 !important;
            border-radius: 8px;
            border: 1px solid #6F7FB7 !important;
        }

        /* Success Messages (Market Green) */
        .stAlert[data-baseweb="notification"] {
            border-radius: 12px !important;
        }
    </style>
    """
    st.markdown(custom_css, unsafe_allow_html=True)

# --- MAIN APP ---
def main():
    st.set_page_config(page_title="Verdix Command Center", layout="centered")
    apply_verdix_theme() # Inject the custom UI/UX

    st.sidebar.image("Verdix.png", use_container_width=True)
    
    st.markdown("<h1 style='color: #BF4343;'>Verdix <span style='color: #6F7FB7;'>|</span> Scorecard</h1>", unsafe_allow_html=True)
    st.write("A streamlined innovation scoring platform bridging academic rigor with VC-grade evaluation.")
    st.markdown("<hr style='border: 1px solid rgba(111, 127, 183, 0.3);'>", unsafe_allow_html=True)

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
        
        st.markdown("<h1 style='text-align: center; color: #DDD3CC;'>Startup Registration</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #6F7FB7; font-size: 1.1rem;'>Build your VC-ready profile and unlock access to the pitch platform.</p><br>", unsafe_allow_html=True)
        
        from datetime import datetime
        deadline = datetime(2026, 3, 15, 23, 59) 
        now = datetime.now()
        
        if now > deadline:
            st.error("🚨 Registration is officially closed.")
        else:
            # --- THE DIGITAL CLOCK (UPDATED PALETTE) ---
            import streamlit.components.v1 as components
            live_clock_html = """
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                body { margin: 0; font-family: sans-serif; background-color: transparent; display: flex; justify-content: center; }
                .container { display: flex; justify-content: center; gap: 15px; margin-top: 10px; margin-bottom: 20px;}
                .block { background-color: #262B34; padding: 15px 25px; border-radius: 12px; text-align: center; border: 1px solid rgba(111,127,183,0.3); box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                .num { font-size: 2.5rem; font-family: 'Courier New', monospace; font-weight: bold; color: #BF4343; line-height: 1; } /* Saffron Red */
                .label { font-size: 0.75rem; color: #DDD3CC; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; } /* Warm Concrete */
                .colon { font-size: 2.5rem; font-weight: bold; color: #6F7FB7; display: flex; align-items: center; padding-bottom: 15px; } /* Taro Leaf */
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
                            document.querySelector('.container').innerHTML = "<div style='color: #BF4343; font-size: 1.5rem; font-weight: bold;'>TIME IS UP!</div>";
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
                "FinTech": "Payments, neobanks, and automated wealth management."
                # Add back the rest of your dictionary here
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

            # Updated Custom Banners (Taro Leaf Border, Charcoal BG)
            banner_style = "border-bottom: 2px solid #6F7FB7; padding-bottom: 5px; color: #DDD3CC; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;"

            with st.container(border=True):
                st.markdown(f"<div style='{banner_style}'>Team & Academic Details</div>", unsafe_allow_html=True)
                col1, col2 = st.columns(2)
                with col1:
                    team_name = st.text_input("Startup / Team Name *")
                    track = st.selectbox("Which Track are you competing in? *", tracks)
                    team_leaders = st.text_area("Team Leaders (Names) *", placeholder="E.g., Alice (CEO)")
                    student_id = st.text_input("Student ID / IC No *")
                with col2:
                    university = st.text_input("University / Institution *")
                    faculty = st.text_input("Faculty / School *")
                    programme = st.text_input("Academic Programme *")

            with st.container(border=True):
                st.markdown(f"<div style='{banner_style}'>Venture Profile</div>", unsafe_allow_html=True)
                selected_industries = st.multiselect("Industry / Tags (Select up to 3) *", list(industry_dict.keys()))
                stage = st.selectbox("Stage of Startup *", [""] + list(stage_dict.keys()))
                value_prop = st.text_area("Value Proposition (The 'Elevator Pitch') *", height=100)
            
            with st.container(border=True):
                st.markdown(f"<div style='{banner_style}'>Media & Links</div>", unsafe_allow_html=True)
                video_link = st.text_input("Pitch Video Link (Optional)")
                deck_link = st.text_input("Pitch Deck / Logo Link *")
            
            st.markdown("<br>", unsafe_allow_html=True)
            _, center_col, _ = st.columns([1, 2, 1])
            with center_col:
                submitted = st.button("🚀 Finalize Profile", type="primary", use_container_width=True)
            
            if submitted:
                if not team_name or not track or not value_prop or not deck_link:
                    st.error("⚠️ Please fill in all required fields (marked with *).")
                else:
                    industry_string = ", ".join(selected_industries)
                    timestamp = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                    
                    ws_teams.append_row([
                        timestamp, submission_type, team_name, track, team_leaders, student_id, 
                        university, faculty, programme, industry_string, stage, value_prop, video_link, deck_link
                    ])
                    st.success(f"✅ Securely logged into Verdix database.")

    # ---------------------------
    # MODE 2: JUDGE PORTAL
    # ---------------------------
    elif menu == "Judge Portal":
        
        st.markdown("<h1 style='text-align: center; color: #DDD3CC;'>Judge Portal</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #6F7FB7; font-size: 1.1rem;'>Review profiles and submit official venture evaluations.</p><br>", unsafe_allow_html=True)
        
        if "judge_logged_in" not in st.session_state:
            st.session_state.judge_logged_in = False
        if "current_judge_name" not in st.session_state:
            st.session_state.current_judge_name = ""

        if not st.session_state.judge_logged_in:
            with st.container(border=True):
                st.markdown("<div style='border-bottom: 2px solid #BF4343; padding-bottom: 5px; color: #DDD3CC; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>🔐 Authenticate</div>", unsafe_allow_html=True)
                judge_name_input = st.text_input("👨‍⚖️ Enter Your Full Name")
                judge_pass_input = st.text_input("🔑 Event Access Code", type="password")
                
                st.markdown("<br>", unsafe_allow_html=True)
                if st.button("Access Dashboard", type="primary", use_container_width=True):
                    if judge_pass_input == "verdix2026": 
                        st.session_state.judge_logged_in = True
                        st.session_state.current_judge_name = judge_name_input
                        st.rerun() 
                    else:
                        st.error("❌ Incorrect Access Code.")
        else:
            col_name, col_logout = st.columns([3, 1])
            with col_name:
                st.info(f"🟢 Secure Session: **{st.session_state.current_judge_name}**")
            with col_logout:
                if st.button("Log Out", use_container_width=True):
                    st.session_state.judge_logged_in = False
                    st.rerun()

            config_data = ws_config.get_all_records()
            tracks = [str(row["Track Name"]) for row in config_data if row.get("Track Name")]
            
            with st.container(border=True):
                st.markdown("<div style='border-bottom: 2px solid #6F7FB7; padding-bottom: 5px; color: #DDD3CC; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>Startup Target</div>", unsafe_allow_html=True)
                selected_track = st.selectbox("📌 Select Track", tracks)
                
                teams_data = ws_teams.get_all_records()
                if not teams_data:
                    st.warning("⚠️ No teams registered.")
                else:
                    df_teams = pd.DataFrame(teams_data)
                    track_teams = df_teams[df_teams['Track'] == selected_track]
                    
                    if not track_teams.empty:
                        team_list = track_teams['Team Name'].tolist()
                        selected_team = st.selectbox("🚀 Select Startup", team_list)
                        team_info = track_teams[track_teams['Team Name'] == selected_team].iloc[-1] 
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                        with st.expander(f"📄 View {selected_team}'s VC Profile", expanded=True):
                            st.markdown(f"**💡 Value Proposition:** {team_info.get('Value Proposition', 'N/A')}")
                            st.markdown(f"**🏷️ Industry:** <span class='market-green'>{team_info.get('Industry / Tags', 'N/A')}</span>", unsafe_allow_html=True)
                            st.markdown("---")
                            st.markdown(f"**👥 Founders:** {team_info.get('Team Leaders (Names)', 'N/A')}")
                            deck_link = team_info.get('Pitch Deck / Logo Link', '')
                            if deck_link: st.markdown(f"[🔗 Open Pitch Deck]({deck_link})")
                            
            if 'track_teams' in locals() and not track_teams.empty:
                st.markdown("<br>", unsafe_allow_html=True)
                with st.container(border=True):
                    st.markdown("<div style='border-bottom: 2px solid #BF4343; padding-bottom: 5px; color: #DDD3CC; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>Scorecard Matrix</div>", unsafe_allow_html=True)
                    
                    with st.form("scoring_form"):
                        st.caption("Rate from 1 (Poor) to 10 (Excellent).")
                        score_1 = st.slider("1. Problem-Solution Fit", 1, 10, 5)
                        score_2 = st.slider("2. Competitor & Market Analysis", 1, 10, 5)
                        score_3 = st.slider("3. Go-to-Market (GTM) Strategy", 1, 10, 5)
                        score_4 = st.slider("4. Innovation / Differentiation", 1, 10, 5)
                        score_5 = st.slider("5. Prototype / MVP Readiness", 1, 10, 5)
                        score_6 = st.slider("6. Revenue Model / Financials", 1, 10, 5)
                        score_7 = st.slider("7. Storytelling & Pitch Delivery", 1, 10, 5)
                        
                        comments = st.text_area("Judge Commentary / Mentor Tips", placeholder="Provide professional critique.")
                        
                        st.markdown("<br>", unsafe_allow_html=True)
                        submit_score = st.form_submit_button("✅ Finalize Score", type="primary", use_container_width=True)
                        
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
        
        st.markdown("<h1 style='text-align: center; color: #DDD3CC;'>Command Center</h1>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; color: #6F7FB7; font-size: 1.1rem;'>Live Leaderboard & Aggregated VC Data</p><br>", unsafe_allow_html=True)

        if "admin_logged_in" not in st.session_state:
            st.session_state.admin_logged_in = False

        if not st.session_state.admin_logged_in:
            with st.container(border=True):
                st.markdown("<div style='border-bottom: 2px solid #BF4343; padding-bottom: 5px; color: #DDD3CC; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>🔒 Master Access</div>", unsafe_allow_html=True)
                admin_pass_input = st.text_input("🔑 Organizer Password", type="password")
                
                st.markdown("<br>", unsafe_allow_html=True)
                if st.button("Unlock Dashboard", type="primary", use_container_width=True):
                    if admin_pass_input == "admin2026": 
                        st.session_state.admin_logged_in = True
                        st.rerun()
                    else:
                        st.error("❌ Denied.")
        else:
            col_title, col_logout = st.columns([3, 1])
            with col_title:
                st.info("🟢 Secure Root Session Active")
            with col_logout:
                if st.button("🔒 Lock System", use_container_width=True):
                    st.session_state.admin_logged_in = False
                    st.rerun()

            scores_data = ws_scores.get_all_records()
            teams_data = ws_teams.get_all_records()

            if not scores_data:
                st.info("📊 Awaiting incoming datastreams...")
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

                if 'Team Name' in df_scores.columns:
                    df_scores['Track'] = df_scores['Team Name'].map(track_dict).fillna("Unknown Track")

                config_data = ws_config.get_all_records()
                tracks = ["All Tracks"] + [str(row["Track Name"]) for row in config_data if row.get("Track Name")]

                with st.container(border=True):
                    st.markdown("<div style='border-bottom: 2px solid #6F7FB7; padding-bottom: 5px; color: #DDD3CC; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>Filter Datastream</div>", unsafe_allow_html=True)
                    selected_view = st.selectbox("🏆 Active Track:", tracks)

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
                        st.warning(f"No datastream for {selected_view}.")
                    else:
                        leaderboard.index = leaderboard.index + 1 
                        leaderboard = leaderboard.rename(columns={'Team Name': 'Startup / Team', 'Average_Score': 'Avg. Score (Out of 70)', 'Judges_Count': '# of Judges'})

                        st.markdown("<br>", unsafe_allow_html=True)
                        with st.container(border=True):
                            # Market Green Banner for Success
                            st.markdown(f"<div style='background-color: #B9C46D; color: #0D101A; padding: 10px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.2rem; margin-bottom: 15px;'>Investment Ready: Top Rankings</div>", unsafe_allow_html=True)

                            st.dataframe(leaderboard, use_container_width=True)

                            with st.expander("🔍 View Raw Score Logs"):
                                desired_cols = ['Timestamp', 'Judge Name', 'Team Name', 'Total Score', 'Feedback / Comments']
                                safe_cols = [col for col in desired_cols if col in df_scores.columns]
                                if safe_cols:
                                    st.dataframe(df_scores[safe_cols].sort_values(by='Timestamp', ascending=False) if 'Timestamp' in safe_cols else df_scores[safe_cols], use_container_width=True)

if __name__ == "__main__":
    main()
