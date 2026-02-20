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
    st.set_page_config(page_title="Verdix", page_icon="⚖️", layout="centered")
    st.sidebar.image("Verdix.png", use_container_width=True)
    
    st.title("⚖️ Verdix")
    st.caption("Startup Pitching & Judging System")

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
        st.header("📝 Team Registration")
        
        # Fetch Tracks from Config
        try:
            config_data = ws_config.get_all_records()
            df_config = pd.DataFrame(config_data)
            track_options = df_config['Track List'].tolist() if not df_config.empty else ["Track A", "Track B"]
        except:
            track_options = ["Track A", "Track B"]

        with st.form("reg_form"):
            team_name = st.text_input("Team Name")
            track = st.selectbox("Select Track", track_options)
            value_prop = st.text_area("Value Proposition")
            logo_link = st.text_input("Link to Logo/Slides")
            
            submitted = st.form_submit_button("Register Team")
            
            if submitted:
                if team_name and value_prop:
                    ws_teams.append_row([team_name, track, value_prop, logo_link, str(datetime.now())])
                    st.success(f"✅ {team_name} successfully registered!")
                else:
                    st.warning("⚠️ Please fill in Team Name and Value Proposition.")

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
