import re
import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/chatbot", tags=["AI Disaster Assistant Chatbot"])

class ChatMessageInput(BaseModel):
    message: str
    language: str = "en"  # "en" or "ta"

# Corpus of highly precise, professional flood safety Q&A in English and Tamil
CHATBOT_KNOWLEDGE_CORPUS = [
    {
        "keywords": ["shelter", "refuge", "camp", "stay", "safe place", "முகாம்", "தங்குமிடம்", "பாதுகாப்பான இடம்"],
        "answer_en": "Emergency shelters are active across high-risk districts! Currently, Saidapet Secondary Relief Camp, Velachery Emergency Shelter Hub, and Kotturpuram Community Relief Center are open with medical, hot food, and infant support. Head to the Map View on our dashboard to locate the shelter nearest to you.",
        "answer_ta": "அவசரக்கால தங்குமிடங்கள் சென்னை முழுவதும் திறக்கப்பட்டுள்ளன! தற்போது சைதாப்பேட்டை, வேளச்சேரி மற்றும் கோட்டூர்புரம் நிவாரண முகாம்கள் உணவு, மருத்துவ வசதிகளுடன் இயங்குகின்றன. உங்களுக்கு அருகிலுள்ள முகாமைக் கண்டறிய 'வரைபடக் காட்சி' (Map View) பக்கத்தைப் பார்க்கவும்."
    },
    {
        "keywords": ["first aid", "first-aid", "drown", "injury", "medical", "முதலுதவி", "காயம்", "மூச்சு", "மருத்துவம்"],
        "answer_en": "🆘 FIRST-AID FOR DROWNING:\n1. Move the person to dry ground safely.\n2. Check for breathing: Listen to their chest. If they are not breathing, start CPR immediately (30 chest compressions to 2 rescue breaths).\n3. Keep the person warm: Wrap in dry blankets to prevent hypothermia.\n4. Call emergency line 108 instantly.",
        "answer_ta": "🆘 நீரில் மூழ்கியவருக்கான முதலுதவி:\n1. பாதிக்கப்பட்டவரைப் பாதுகாப்பாக உலர்ந்த தரைக்குக் கொண்டு வாருங்கள்.\n2. சுவாசத்தை சரிபார்க்கவும்: நெஞ்சுப் பகுதியை உற்று நோக்கவும். சுவாசம் இல்லை எனில், உடனடியாக சி.பி.ஆர் (CPR) செய்யுங்கள் (30 மார்பு அமுக்கம் : 2 செயற்கை சுவாசம்).\n3. உடலை கதகதப்பாக வைக்கவும்: போர்வையால் போர்த்தவும்.\n4. அவசர எண் 108 ஐ உடனடியாக அழைக்கவும்."
    },
    {
        "keywords": ["prepare", "kit", "bag", "emergency supply", "food", "தயாராக", "தேவை", "பொருட்கள்", "உணவு"],
        "answer_en": "🎒 FLOOD EMERGENCY PREPAREDNESS BAG:\n- Pack 3 days of non-perishable food (biscuits, canned items) and bottled water (3 liters/day).\n- Critical medical supplies, first-aid items, and prescription pills.\n- A battery-powered flashlight, spare batteries, and a charged power bank.\n- Wrap primary legal/financial documents in thick plastic ziplocks.",
        "answer_ta": "🎒 அவசரக்கால வெள்ளத் தயாரிப்புப் பை:\n- 3 நாட்களுக்குத் தேவையான கெடாத உணவுகள் (பிஸ்கட், ரஸ்க்) மற்றும் குடிநீர்.\n- அத்தியாவசிய மருந்துகள் மற்றும் முதலுதவிப் பெட்டி.\n- டார்ச் லைட், கூடுதல் பேட்டரிகள் மற்றும் முழுமையாக சார்ஜ் செய்யப்பட்ட பவர் பேங்க்.\n- ரேஷன் கார்டு, ஆதார் போன்ற முக்கிய ஆவணங்களை பிளாஸ்டிக் கவரில் வைக்கவும்."
    },
    {
        "keywords": ["contact", "helpline", "phone", "number", "police", "control room", "எண்", "தொலைபேசி", "உதவி", "போலீஸ்"],
        "answer_en": "📞 DISASTER HELPLINES (TAMIL NADU):\n- State Disaster Control Room: 1070\n- District Emergency Operations: 1077\n- Chennai Corporation Helpline: 1913\n- Emergency Ambulance: 108\n- Fire & Rescue: 101",
        "answer_ta": "📞 பேரிடர் அவசர உதவி எண்கள் (தமிழ்நாடு):\n- மாநில பேரிடர் கட்டுப்பாட்டு அறை: 1070\n- மாவட்ட அவசர கால கட்டுப்பாட்டு மையம்: 1077\n- சென்னை மாநகராட்சி உதவி எண்: 1913\n- அவசர ஆம்புலன்ஸ் சேவை: 108\n- தீயணைப்பு மற்றும் மீட்புத்துறை: 101"
    },
    {
        "keywords": ["tamil", "தமிழ்", "ta", "மொழியில்"],
        "answer_en": "Vanakkam! I can support you in English and Tamil. Type 'shelters in Tamil' or write to me in Tamil (e.g., 'முதலுதவி குறிப்புகள்') for instant regional safety advice.",
        "answer_ta": "வணக்கம்! நான் உங்களுக்கு தமிழ் மற்றும் ஆங்கிலத்தில் உதவ முடியும். 'உதவி எண்கள்', 'முதலுதவி குறிப்புகள்' அல்லது 'தங்குமிடம்' என தட்டச்சு செய்து அவசர தகவல்களைப் பெற்றுக் கொள்ளலாம்."
    },
    {
        "keywords": ["water level", "river", "reservoir", "lake", "அணை", "ஆறு", "ஏரி"],
        "answer_en": "Monitor major reservoirs surrounding Chennai via the Live Analytics tab. If a water level exceeds 7.5 meters, local drainage flood gates are opened. Evacuate immediately if your locality is within 2 kilometers of a discharged canal.",
        "answer_ta": "சென்னையை சுற்றியுள்ள ஏரிகளின் நீர்மட்டத்தை எங்களின் நேரடித் தரவு பக்கத்தில் கண்காணிக்கலாம். நீர்மட்டம் 7.5 மீட்டரைத் தாண்டினால் உபரிநீர் கால்வாய்களில் திறக்கப்படும். வடிகால் அருகே வசிப்பவர்கள் எச்சரிக்கையுடன் செயல்பட வேண்டும்."
    }
]

def preprocess_text(text: str) -> str:
    # Lowercase, strip punctuation and extra spaces
    text = text.lower()
    text = re.sub(r"[^\w\s\u0b80-\u0bff]", "", text)  # preserves Tamil characters unicode
    return text

@router.post("")
def chat_with_assistant(chat_input: ChatMessageInput):
    user_msg = preprocess_text(chat_input.message)
    user_lang = chat_input.language.lower()
    
    best_match = None
    max_matches = 0
    
    # Calculate simple keyword intersection overlap (highly efficient vector mock)
    for qa in CHATBOT_KNOWLEDGE_CORPUS:
        match_count = 0
        for keyword in qa["keywords"]:
            if keyword in user_msg:
                match_count += 1
        
        if match_count > max_matches:
            max_matches = match_count
            best_match = qa
            
    if best_match and max_matches > 0:
        # Determine language output
        if user_lang == "ta" or any(kw in user_msg for kw in ["தமிழ்", "முதலுதவி", "முகாம்", "எண்"]):
            reply = best_match["answer_ta"]
        else:
            reply = best_match["answer_en"]
    else:
        # Generative fallback prompts
        if user_lang == "ta":
            reply = "மன்னிக்கவும், தங்களின் கேள்வி எனக்கு முழுமையாகப் புரியவில்லை. என்னால் தங்குமிடங்கள், பேரிடர் அவசர உதவி எண்கள், வெள்ளத் தயாரிப்புப் பொருட்கள் மற்றும் முதலுதவி குறிப்புகள் ஆகியவற்றைப் பற்றி கூற முடியும். தயவுசெய்து தங்களின் கேள்வியைச் சுருக்கமாக தட்டச்சு செய்யவும்."
        else:
            reply = "I couldn't fully comprehend that question. As an AI Disaster Sentinel, I can assist you with emergency shelter lists, local helpline contacts, first-aid guides, and preparation lists. Please specify one of these topics!"

    return {
        "reply": reply,
        "language": "ta" if "தமிழ்" in user_msg or user_lang == "ta" else "en",
        "confidence": 1.0 if max_matches > 0 else 0.5
    }
