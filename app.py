# --- UX & VERDIX CUSTOM BRANDING ---
    hide_st_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            header {visibility: hidden;}

            /* --- 1. PRIMARY SUBMIT BUTTONS --- */
            .stButton > button[kind="primary"] {
                background-color: #BF1A1A !important;
                border: 2px solid #BF1A1A !important;
                color: #FFFFFF !important;
                border-radius: 6px !important;
                font-weight: bold !important;
                transition: all 0.3s ease !important;
            }
            .stButton > button[kind="primary"]:hover {
                background-color: #0A0A0A !important; /* Turns deep black on hover */
                color: #FFFFFF !important; /* FIX: Text stays bright white for readability */
                border: 2px solid #BF1A1A !important;
                transform: scale(1.02);
                box-shadow: 0 4px 15px rgba(191, 26, 26, 0.6) !important; /* FIX: Added Verdix red glow shadow for depth */
            }

            /* --- 2. SIDEBAR NAVIGATION BARS --- */
            /* Hide the default radio button circles */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label > div:first-child {
                display: none !important;
            }
            
            /* Style the background bars */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label {
                background-color: #1A1A1A !important; /* Sleek Black */
                padding: 12px 15px !important;
                border-radius: 6px !important;
                margin-bottom: 8px !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                border: 1px solid #333333 !important;
            }
            
            /* FIX: Brute-force the text inside the bars to be bright white */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label p, 
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label span {
                color: #FFFFFF !important;
                font-weight: 600 !important;
            }
            
            /* Hover State -> Turns Verdix Red with a slight shadow */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label:hover {
                background-color: #BF1A1A !important;
                border-color: #BF1A1A !important;
                transform: translateX(4px); /* Slight slide to the right */
                box-shadow: 0 4px 10px rgba(191, 26, 26, 0.3) !important;
            }
            
            /* Active/Selected State -> Stays Verdix Red with stronger shadow */
            [data-testid="stSidebar"] [data-testid="stRadio"] div[role="radiogroup"] label:has(input:checked) {
                background-color: #BF1A1A !important;
                border-color: #BF1A1A !important;
                box-shadow: 0 4px 12px rgba(191, 26, 26, 0.6) !important;
            }
            </style>
            """
    st.markdown(hide_st_style, unsafe_allow_html=True)
    # ----------------------------------
