// ==========================================================================
// Scheme Connect - AI Voice Assistant Engine
// Assistant Name: Scheme Connect Voice Assistant
// Supports English & Kannada (ಕನ್ನಡ) Speech-to-Text & Text-to-Speech
// ==========================================================================

const ASSISTANT_STATE = {
  isOpen: false,
  language: 'en', // 'en' or 'kn'
  isListening: false,
  isSpeaking: false,
  isMuted: false,
  recognition: null,
  chatHistory: []
};

// Initialize Speech Recognition & Synthesis
function initAssistantEngine() {
  // Speech Recognition setup (Web Speech API)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    ASSISTANT_STATE.recognition = new SpeechRecognition();
    ASSISTANT_STATE.recognition.continuous = false;
    ASSISTANT_STATE.recognition.interimResults = false;

    ASSISTANT_STATE.recognition.onstart = () => {
      ASSISTANT_STATE.isListening = true;
      updateAssistantUIState();
    };

    ASSISTANT_STATE.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      ASSISTANT_STATE.isListening = false;
      updateAssistantUIState();
      handleUserQuery(transcript);
    };

    ASSISTANT_STATE.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      ASSISTANT_STATE.isListening = false;
      updateAssistantUIState();
      if (event.error === 'not-allowed') {
        showToast(
          ASSISTANT_STATE.language === 'kn'
            ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.'
            : 'Microphone permission denied. Please enable microphone access in your browser.'
        );
      }
    };

    ASSISTANT_STATE.recognition.onend = () => {
      ASSISTANT_STATE.isListening = false;
      updateAssistantUIState();
    };
  }

  // Load initial welcome message
  loadWelcomeMessage();
}

function loadWelcomeMessage() {
  const isKn = ASSISTANT_STATE.language === 'kn';
  const welcomeText = isKn ? TRANSLATIONS.kn.assistant_welcome : TRANSLATIONS.en.assistant_welcome;
  
  if (ASSISTANT_STATE.chatHistory.length === 0) {
    ASSISTANT_STATE.chatHistory.push({
      sender: 'assistant',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      links: []
    });
  }
}

// Start / Stop Microphone Listening
function toggleMicrophone() {
  if (!ASSISTANT_STATE.recognition) {
    showToast(
      ASSISTANT_STATE.language === 'kn'
        ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ.'
        : 'Voice speech recognition is not supported in this browser. Please type your question.'
    );
    return;
  }

  if (ASSISTANT_STATE.isListening) {
    ASSISTANT_STATE.recognition.stop();
  } else {
    // Stop any ongoing speech
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    // Set appropriate language code
    ASSISTANT_STATE.recognition.lang = ASSISTANT_STATE.language === 'kn' ? 'kn-IN' : 'en-IN';
    try {
      ASSISTANT_STATE.recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  }
}

// Text-to-Speech Output
function speakResponse(text) {
  if (ASSISTANT_STATE.isMuted) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel(); // Stop any previous speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = ASSISTANT_STATE.language === 'kn' ? 'kn-IN' : 'en-IN';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Attempt to select an Indian English or Kannada voice if available
  const voices = window.speechSynthesis.getVoices();
  if (ASSISTANT_STATE.language === 'kn') {
    const knVoice = voices.find(v => v.lang.includes('kn') || v.name.toLowerCase().includes('kannada'));
    if (knVoice) utterance.voice = knVoice;
  } else {
    const inVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India'));
    if (inVoice) utterance.voice = inVoice;
  }

  utterance.onstart = () => {
    ASSISTANT_STATE.isSpeaking = true;
    updateSpeakingIndicator(true);
  };

  utterance.onend = () => {
    ASSISTANT_STATE.isSpeaking = false;
    updateSpeakingIndicator(false);
  };

  utterance.onerror = () => {
    ASSISTANT_STATE.isSpeaking = false;
    updateSpeakingIndicator(false);
  };

  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    ASSISTANT_STATE.isSpeaking = false;
    updateSpeakingIndicator(false);
  }
}

// Query Interpretation & Response Generator
function handleUserQuery(queryText) {
  if (!queryText || !queryText.trim()) return;

  // Add User Message
  ASSISTANT_STATE.chatHistory.push({
    sender: 'user',
    text: queryText.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  renderChatMessages();

  // Scroll chat to bottom
  scrollChatToBottom();

  // Generate Answer
  setTimeout(() => {
    const response = processQueryLogic(queryText.trim());
    ASSISTANT_STATE.chatHistory.push({
      sender: 'assistant',
      text: response.text,
      spokenText: response.spokenText || response.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      links: response.links || [],
      action: response.action || null
    });

    renderChatMessages();
    scrollChatToBottom();

    // Speak response aloud if not muted
    speakResponse(response.spokenText || response.text);
  }, 400);
}

// Intelligent Rule-Based & Semantic Matching Engine for Verified Schemes
function processQueryLogic(query) {
  const isKn = ASSISTANT_STATE.language === 'kn' || /[\u0C80-\u0CFF]/.test(query);
  const q = query.toLowerCase();

  // 1. Farmer Schemes Query
  if (
    q.includes('farmer') || q.includes('agriculture') || q.includes('crop') || q.includes('kisan') ||
    q.includes('ರೈತ') || q.includes('ಕೃಷಿ') || q.includes('ಬೆಳೆ') || q.includes('ಕಿಸಾನ್')
  ) {
    if (isKn) {
      return {
        text: `ರೈತರಿಗೆ ಪ್ರಮುಖ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ:\n\n1. **ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ (PM-KISAN):** ಅರ್ಹ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವರ್ಷಕ್ಕೆ ₹6,000 ನೇರ ಆರ್ಥಿಕ ನೆರವು.\n2. **ಪಿಎಂ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (PMFBY):** ಅತಿವೃಷ್ಟಿ, ಅನಾವೃಷ್ಟಿ ನಷ್ಟಕ್ಕೆ ಸಮಗ್ರ ಬೆಳೆ ವಿಮೆ.\n3. **ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC):** ಕೇವಲ 4% ಬಡ್ಡಿದರದಲ್ಲಿ ಕೃಷಿ ಸಾಲ.\n4. **ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ (ಕರ್ನಾಟಕ):** ಕೃಷಿ ಹೊಂಡ, ಪಾಲಿಥೀನ್ ಹೊದಿಕೆ ಮತ್ತು ಹನಿ ನೀರಾವರಿಗೆ 80%-90% ಸಬ್ಸಿಡಿ.\n\nಗಮನಿಸಿ: ಅರ್ಹತಾ ಮಾರ್ಗದರ್ಶನವು ಪ್ರಾಥಮಿಕವಾಗಿದ್ದು, ಅಂತಿಮ ಅನುಮೋದನೆಯನ್ನು ಕೃಷಿ ಇಲಾಖೆ ನಿರ್ಧರಿಸುತ್ತದೆ.`,
        spokenText: "ರೈತರಿಗೆ ಪಿಎಂ ಕಿಸಾನ್, ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ, ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಮತ್ತು ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ. ಪಿಎಂ ಕಿಸಾನ್ ಮೂಲಕ ವರ್ಷಕ್ಕೆ ಆರು ಸಾವಿರ ರೂಪಾಯಿ ನೇರ ನೆರವು ಸಿಗುತ್ತದೆ.",
        links: [
          { label: "PM-KISAN ಅಧಿಕೃತ ಪೋರ್ಟಲ್", url: "https://pmkisan.gov.in/" },
          { label: "PMFBY ಬೆಳೆ ವಿಮೆ ಪೋರ್ಟಲ್", url: "https://pmfby.gov.in/" }
        ],
        action: { label: "ಕೃಷಿ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ", filter: "agriculture" }
      };
    } else {
      return {
        text: `Here are the top verified government schemes available for farmers:\n\n1. **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi):** Direct financial assistance of ₹6,000 per year in 3 equal instalments for all landholding farmers.\n2. **PM Fasal Bima Yojana (PMFBY):** Comprehensive crop insurance against droughts, floods, and pests with low farmer premium (1.5% - 2%).\n3. **Kisan Credit Card (KCC):** Subsidized agricultural credit at an effective 4% interest rate.\n4. **Krishi Bhagya (Karnataka):** Up to 80%-90% subsidy for farm ponds and micro-irrigation.\n\n*Note: Eligibility guidance is preliminary; final approval is determined by the Ministry of Agriculture.*`,
        spokenText: "For farmers, key schemes include PM-KISAN which provides 6,000 rupees per year, PM Fasal Bima Yojana for crop insurance, Kisan Credit Card, and Krishi Bhagya in Karnataka.",
        links: [
          { label: "PM-KISAN Portal", url: "https://pmkisan.gov.in/" },
          { label: "National Crop Insurance Portal", url: "https://pmfby.gov.in/" }
        ],
        action: { label: "View Agriculture Schemes", filter: "agriculture" }
      };
    }
  }

  // 2. Student & Scholarship Query
  if (
    q.includes('student') || q.includes('scholarship') || q.includes('education') || q.includes('study') || q.includes('college') ||
    q.includes('ವಿದ್ಯಾರ್ಥಿ') || q.includes('ವಿದ್ಯಾರ್ಥಿವೇತನ') || q.includes('ಶಿಕ್ಷಣ') || q.includes('ಕಾಲೇಜು') || q.includes('ಶಾಲೆ')
  ) {
    if (isKn) {
      return {
        text: `ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಪ್ರಮುಖ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆಗಳು:\n\n1. **ಪಿಎಂ-ಯುಎಸ್‌ಪಿ (CSSS):** ಪದವಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಾರ್ಷಿಕ ₹12,000 ಮತ್ತು ಸ್ನಾತಕೋತ್ತರ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ₹20,000 ವಿದ್ಯಾರ್ಥಿವೇತನ.\n2. **ರಾಷ್ಟ್ರೀಯ ಮೆರಿಟ್ ವಿದ್ಯಾರ್ಥಿವೇತನ (NMMSS):** 9 ರಿಂದ 12 ನೇ ತರಗತಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ವಾರ್ಷಿಕ ₹12,000 ನೆರವು.\n3. **ಕರ್ನಾಟಕ ರಾಜ್ಯ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ (SSP):** ಪಿಯುಸಿ, ಪದವಿ, ಇಂಜಿನಿಯರಿಂಗ್, ವೈದ್ಯಕೀಯ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಶುಲ್ಕ ಮರುಪಾವತಿ.\n4. **ವಿದ್ಯಾಸಿರಿ ಯೋಜನೆ (ಕರ್ನಾಟಕ):** ಹಾಸ್ಟೆಲ್ ಸಿಗದ ಹಿಂದುಳಿದ ವರ್ಗದ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಊಟ ಮತ್ತು ವಸತಿಗಾಗಿ ತಿಂಗಳಿಗೆ ₹1,500 (ವಾರ್ಷಿಕ ₹15,000).\n5. **ಮುಖ್ಯಮಂತ್ರಿ ರೈತ ವಿದ್ಯಾನಿಧಿ:** ರೈತರ ಮಕ್ಕಳಿಗೆ ₹2,500 ರಿಂದ ₹11,000 ವರೆಗೆ ಹೆಚ್ಚುವರಿ ವಿದ್ಯಾರ್ಥಿವೇತನ.`,
        spokenText: "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಪಿಎಂ ಯುಎಸ್ಪಿ ಕೇಂದ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ, ಕರ್ನಾಟಕ ಎಸ್‌ಎಸ್‌ಪಿ ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ, ವಿದ್ಯಾಸಿರಿ ಮತ್ತು ರೈತ ವಿದ್ಯಾನಿಧಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ.",
        links: [
          { label: "National Scholarship Portal (NSP)", url: "https://scholarships.gov.in/" },
          { label: "Karnataka SSP Portal", url: "https://ssp.postmatric.karnataka.gov.in/" }
        ],
        action: { label: "ಶಿಕ್ಷಣ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ", filter: "education" }
      };
    } else {
      return {
        text: `Here are the top scholarships available for students:\n\n1. **PM-USP Central Sector Scheme of Scholarship (CSSS):** ₹12,000/year for undergraduate and ₹20,000/year for postgraduate studies for Class 12 top percentile scorers.\n2. **National Means-cum-Merit Scholarship (NMMSS):** ₹12,000/year for Class 9-12 students from families earning under ₹3.5 Lakh.\n3. **Karnataka State Post-Matric Scholarship (SSP):** Comprehensive fee reimbursement and maintenance allowance for SC/ST and OBC students.\n4. **Vidyasiri Scheme (Karnataka):** ₹1,500/month (₹15,000/year) food and accommodation stipend for Backward Classes students outside hostels.\n5. **CM Raitha Vidya Nidhi:** ₹2,500 to ₹11,000/year for children of farmers.`,
        spokenText: "Key student scholarships include PM-USP Central Sector Scheme, Karnataka SSP Post-Matric scholarship, Vidyasiri food stipend, and Chief Minister Raitha Vidya Nidhi.",
        links: [
          { label: "National Scholarship Portal", url: "https://scholarships.gov.in/" },
          { label: "Karnataka SSP Portal", url: "https://ssp.postmatric.karnataka.gov.in/" }
        ],
        action: { label: "View Education Schemes", filter: "education" }
      };
    }
  }

  // 3. Housing Schemes Query
  if (
    q.includes('house') || q.includes('housing') || q.includes('pmay') || q.includes('awas') || q.includes('shelter') ||
    q.includes('ಮನೆ') || q.includes('ವಸತಿ') || q.includes('ಆವಾಸ್')
  ) {
    if (isKn) {
      return {
        text: `ವಸತಿ ಯೋಜನೆಗಳ ವಿವರ:\n\n1. **ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ – ಗ್ರಾಮೀಣ (PMAY-G):** ಸ್ವಂತ ಪಕ್ಕಾ ಮನೆ ನಿರ್ಮಿಸಲು ಗ್ರಾಮೀಣ ಬಡ ಕುಟುಂಬಗಳಿಗೆ ₹1,20,000 ನೇರ ಅನುದಾನ, ಜೊತೆಗೆ ಶೌಚಾಲಯ ನಿರ್ಮಾಣಕ್ಕೆ ₹12,000 ಮತ್ತು ಉದ್ಯೋಗ ಖಾತರಿ ವೇತನ.\n2. **ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ – ನಗರ (PMAY-U 2.0):** ನಗರ ಪ್ರದೇಶದಲ್ಲಿ ಸ್ವಂತ ನಿವೇಶನದಲ್ಲಿ ಮನೆ ಕಟ್ಟಲು ಅಥವಾ ಖರೀದಿಸಲು ₹2,50,000 ವರೆಗೆ ಕೇಂದ್ರ ಸಹಾಯಧನ ಮತ್ತು ಬಡ್ಡಿ ಸಬ್ಸಿಡಿ.\n\nಅರ್ಹತೆ: ಕುಟುಂಬದಲ್ಲಿ ಭಾರತದ ಯಾವುದೇ ಭಾಗದಲ್ಲಿ ಸ್ವಂತ ಪಕ್ಕಾ ಮನೆ ಇರಬಾರದು.`,
        spokenText: "ವಸತಿಗಾಗಿ ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ ಗ್ರಾಮೀಣ ಮತ್ತು ನಗರ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ. ಗ್ರಾಮೀಣ ಭಾಗದಲ್ಲಿ ಮನೆ ನಿರ್ಮಾಣಕ್ಕೆ ಒಂದು ಲಕ್ಷದ ಇಪ್ಪತ್ತು ಸಾವಿರ ರೂಪಾಯಿ ನೇರ ಅನುದಾನ ಸಿಗುತ್ತದೆ.",
        links: [
          { label: "PMAY-G ಅಧಿಕೃತ ಪೋರ್ಟಲ್", url: "https://pmayg.nic.in/" },
          { label: "PMAY-U ಅಧಿಕೃತ ಪೋರ್ಟಲ್", url: "https://pmaymis.gov.in/" }
        ],
        action: { label: "ವಸತಿ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ", filter: "housing" }
      };
    } else {
      return {
        text: `Here are the major government housing schemes:\n\n1. **PMAY-Gramin (Rural):** Direct financial assistance of ₹1,20,000 (plain areas) to ₹1,30,000 (hilly areas) for homeless rural families to construct a permanent pucca house, plus ₹12,000 for toilet and 90 days MGNREGS labor.\n2. **PMAY-Urban (PMAY-U 2.0):** Subsidies and interest relief up to ₹2.5 Lakh for Economically Weaker Sections (EWS) and Low-Income Groups (LIG) in cities.\n\n*Basic Eligibility: The applicant's household must not own a pucca house anywhere in India.*`,
        spokenText: "Government housing schemes include PMAY Gramin providing 1.2 Lakh rupees for rural home construction, and PMAY Urban providing subsidies up to 2.5 Lakh rupees.",
        links: [
          { label: "PMAY-Gramin Official Portal", url: "https://pmayg.nic.in/" },
          { label: "PMAY-Urban Official Portal", url: "https://pmaymis.gov.in/" }
        ],
        action: { label: "View Housing Schemes", filter: "housing" }
      };
    }
  }

  // 4. Women Empowerment & Financial Support
  if (
    q.includes('women') || q.includes('woman') || q.includes('girl') || q.includes('female') || q.includes('mother') ||
    q.includes('ಮಹಿಳೆ') || q.includes('ಹೆಣ್ಣು') || q.includes('ತಾಯಿ') || q.includes('ಗೃಹಲಕ್ಷ್ಮಿ')
  ) {
    if (isKn) {
      return {
        text: `ಮಹಿಳೆಯರಿಗೆ ಪ್ರಮುಖ ಆರ್ಥಿಕ ಮತ್ತು ಸಬಲೀಕರಣ ಯೋಜನೆಗಳು:\n\n1. **ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆ (ಕರ್ನಾಟಕ):** ಕುಟುಂಬದ ಯಜಮಾನಿ ಮಹಿಳೆಗೆ ಪ್ರತಿ ತಿಂಗಳು ₹2,000 ನೇರ ನಗದು ವರ್ಗಾವಣೆ (ವಾರ್ಷಿಕ ₹24,000).\n2. **ಶಕ್ತಿ ಯೋಜನೆ (ಕರ್ನಾಟಕ):** ಕರ್ನಾಟಕದ ಎಲ್ಲಾ ಮಹಿಳೆಯರಿಗೆ ರಾಜ್ಯದ ಸರ್ಕಾರಿ ಬಸ್‌ಗಳಲ್ಲಿ 100% ಉಚಿತ ಪ್ರಯಾಣ.\n3. **ಪ್ರಧಾನ ಮಂತ್ರಿ ಮಾತೃ ವಂದನಾ ಯೋಜನೆ (PMMVY):** ಗರ್ಭಿಣಿಯರು ಮತ್ತು ಬಾಣಂತಿಯರಿಗೆ ಪೌಷ್ಟಿಕ ಆಹಾರಕ್ಕಾಗಿ ₹5,000 ರಿಂದ ₹6,000 ಆರ್ಥಿಕ ನೆರವು.\n4. **ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ (SSY):** 10 ವರ್ಷದೊಳಗಿನ ಹೆಣ್ಣುಮಕ್ಕಳ ಶಿಕ್ಷಣ ಮತ್ತು ಭವಿಷ್ಯಕ್ಕಾಗಿ ವಾರ್ಷಿಕ 8.2% ಹೆಚ್ಚಿನ ಬಡ್ಡಿದರ ಮತ್ತು ತೆರಿಗೆ ಮುಕ್ತ ಉಳಿತಾಯ ಖಾತೆ.\n5. **ಉದ್ಯೋಗಿನಿ ಯೋಜನೆ:** ಮಹಿಳಾ ಉದ್ಯಮಿಗಳಿಗೆ ವ್ಯಾಪಾರ ಪ್ರಾರಂಭಿಸಲು 30% ರಿಂದ 50% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ ₹3 ಲಕ್ಷದವರೆಗೆ ಬ್ಯಾಂಕ್ ಸಾಲ.`,
        spokenText: "ಮಹಿಳೆಯರಿಗೆ ಕರ್ನಾಟಕದ ಗೃಹಲಕ್ಷ್ಮಿ ಯೋಜನೆಯಡಿ ಪ್ರತಿ ತಿಂಗಳು ಎರಡು ಸಾವಿರ ರೂಪಾಯಿ, ಶಕ್ತಿ ಯೋಜನೆಯಡಿ ಉಚಿತ ಬಸ್ ಪ್ರಯಾಣ, ಮಾತೃ ವಂದನಾ ಮತ್ತು ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ.",
        links: [
          { label: "Seva Sindhu Karnataka", url: "https://sevasindhu.karnataka.gov.in/" },
          { label: "PMMVY Official Portal", url: "https://pmmvy.wcd.gov.in/" }
        ],
        action: { label: "ಮಹಿಳಾ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ", filter: "women" }
      };
    } else {
      return {
        text: `Here are major welfare and financial schemes for women:\n\n1. **Gruha Lakshmi (Karnataka):** Monthly direct benefit transfer of ₹2,000 (₹24,000/year) to the woman head of household.\n2. **Shakti Scheme (Karnataka):** Free public bus transit across Karnataka state-run buses for all women and girl students.\n3. **PMMVY (Pradhan Mantri Matru Vandana Yojana):** Maternity cash benefit of ₹5,000 for the first child and ₹6,000 for the second girl child.\n4. **Sukanya Samriddhi Yojana (SSY):** High-interest government savings account (8.2% p.a.) with triple tax exemption for a girl child's education and future.\n5. **Udyogini Scheme:** Bank loans up to ₹3 Lakh with 30%-50% capital subsidy for women entrepreneurs.`,
        spokenText: "For women, prominent schemes include Karnataka's Gruha Lakshmi with 2,000 rupees monthly assistance, Shakti free bus travel, PMMVY maternity benefits, and Sukanya Samriddhi savings.",
        links: [
          { label: "Karnataka Seva Sindhu", url: "https://sevasindhu.karnataka.gov.in/" },
          { label: "PMMVY Portal", url: "https://pmmvy.wcd.gov.in/" }
        ],
        action: { label: "View Women Empowerment Schemes", filter: "women" }
      };
    }
  }

  // 5. Documents Inquiry
  if (
    q.includes('document') || q.includes('aadhaar') || q.includes('ration') || q.includes('certificate') ||
    q.includes('ದಾಖಲೆ') || q.includes('ಆಧಾರ್') || q.includes('ರೇಷನ್') || q.includes('ಪ್ರಮಾಣಪತ್ರ')
  ) {
    if (isKn) {
      return {
        text: `ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಾಮಾನ್ಯವಾಗಿ ಈ ಕೆಳಗಿನ ಮೂಲ ದಾಖಲೆಗಳು ಅಗತ್ಯವಾಗಿರುತ್ತವೆ:\n\n1. **ಗುರುತಿನ ಪುರಾವೆ:** ಆಧಾರ್ ಕಾರ್ಡ್ (ಮೊಬೈಲ್ ಮತ್ತು ಬ್ಯಾಂಕ್‌ಗೆ ಲಿಂಕ್ ಆಗಿರಬೇಕು).\n2. **ವಿಳಾಸ / ವಾಸಸ್ಥಳ ದೃಢೀಕರಣ:** ರೇಷನ್ ಕಾರ್ಡ್ ಅಥವಾ ವಾಸಸ್ಥಳ ಪ್ರಮಾಣಪತ್ರ.\n3. **ಬ್ಯಾಂಕ್ ಖಾತೆ:** ಆಧಾರ್ ಸೀಡ್ ಆಗಿರುವ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಪ್ರತಿ (DBT ಗಾಗಿ).\n4. **ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ:** ತಹಶೀಲ್ದಾರ್ / ಕಂದಾಯ ಇಲಾಖೆಯಿಂದ ಪಡೆದ ಚಾಲ್ತಿ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ (RD ಸಂಖ್ಯೆ).\n5. **ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ:** ಪರಿಶಿಷ್ಟ ಜಾತಿ / ಪರಿಶಿಷ್ಟ ಪಂಗಡ / ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಸವಲತ್ತುಗಳಿಗೆ.\n6. **ಕೃಷಿ ಯೋಜನೆಗಳಿಗೆ:** ಭೂಮಿ ಪಹಣಿ / ಆರ್‌ಟಿಸಿ (RTC) ಮತ್ತು FRUITS FID ಸಂಖ್ಯೆ.\n\nನಿಮ್ಮ ದಾಖಲೆಗಳ ಸ್ಪಷ್ಟತೆ ಮತ್ತು ದೋಷಗಳನ್ನು ಪರೀಕ್ಷಿಸಲು ನಮ್ಮ **'ದಾಖಲೆ ಪರಿಶೀಲಕ (Document Checker)'** ಬಳಸಿ!`,
        spokenText: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗೆ ಆಧಾರ್ ಕಾರ್ಡ್, ರೇಷನ್ ಕಾರ್ಡ್, ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್, ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರಗಳು ಮುಖ್ಯವಾಗಿ ಬೇಕಾಗುತ್ತವೆ. ನಮ್ಮ ಡಾಕ್ಯುಮೆಂಟ್ ಚೆಕರ್ ಮೂಲಕ ಪರಿಶೀಲಿಸಿಕೊಳ್ಳಿ.",
        links: [
          { label: "ದಾಖಲೆ ಪರಿಶೀಲಕ ಸಾಧನ ತೆರೆಯಿರಿ", url: "#document-checker" }
        ],
        action: { label: "ಡಾಕ್ಯುಮೆಂಟ್ ಚೆಕರ್‌ಗೆ ಹೋಗಿ", scrollId: "document-checker" }
      };
    } else {
      return {
        text: `Most government welfare schemes typically require the following core documents:\n\n1. **Identity Proof:** Aadhaar Card (linked to active mobile number and bank account).\n2. **Residence Proof:** Ration Card (BPL/AAY/APL) or Domicile Certificate.\n3. **Bank Account Details:** Aadhaar-seeded Bank Passbook (NPCI mapped for DBT payouts).\n4. **Income Certificate:** Valid certificate issued by Revenue Authority / Tahsildar.\n5. **Caste Certificate:** If applying under SC/ST/OBC category scholarships or subsidies.\n6. **For Farmers:** Land Records (RTC / Pahani / 7/12) and Farmer ID (FRUITS FID).\n\n*Tip: Use our **AI Document Checker** to check your document quality and readability before applying!*`,
        spokenText: "Common documents required include Aadhaar card, ration card, Aadhaar seeded bank passbook, income certificate, and land records for farmers. You can verify your documents using our AI Document Checker.",
        links: [
          { label: "Open Document Checker", url: "#document-checker" }
        ],
        action: { label: "Go to Document Checker", scrollId: "document-checker" }
      };
    }
  }

  // 6. Generic "What is available to me" / Eligibility Inquiry
  if (
    q.includes('available to me') || q.includes('eligible') || q.includes('which scheme') ||
    q.includes('ನನಗೆ ಯಾವ') || q.includes('ಅರ್ಹತೆ') || q.includes('ಯಾವ ಯೋಜನೆ')
  ) {
    if (isKn) {
      return {
        text: `ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ವಿವರಗಳ ಆಧಾರದ ಮೇಲೆ ಸೂಕ್ತವಾದ ಯೋಜನೆಗಳನ್ನು ಕಂಡುಕೊಳ್ಳಲು ನಮ್ಮ **'ಅರ್ಹತೆ ಪರಿಶೀಲಕ (Eligibility Checker)'** ಅನ್ನು ಬಳಸಿ.\n\nನಿಮ್ಮ ವಯಸ್ಸು, ರಾಜ್ಯ, ಉದ್ಯೋಗ ಮತ್ತು ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯವನ್ನು ಆಯ್ಕೆ ಮಾಡಿದರೆ, ಸಿಸ್ಟಮ್ ತಕ್ಷಣವೇ ನಿಮಗಾಗಿ ಹೊಂದಾಣಿಕೆಯಾಗುವ ಯೋಜನೆಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.\n\nಉದಾಹರಣೆಗೆ:\n• ರೈತರಿಗೆ: PM-KISAN, ಫಸಲ್ ಬಿಮಾ, ಕೃಷಿ ಭಾಗ್ಯ\n• ಮಹಿಳೆಯರಿಗೆ: ಗೃಹಲಕ್ಷ್ಮಿ, ಶಕ್ತಿ, ಉಜ್ವಲ, ಮಾತೃ ವಂದನಾ\n• ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ: ಎಸ್‌ಎಸ್‌ಪಿ ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್, ವಿದ್ಯಾಸಿರಿ, ರೈತ ವಿದ್ಯಾನಿಧಿ\n• ಕಾರ್ಮಿಕರಿಗೆ: ಶ್ರಮ ಯೋಗಿ ಮಾನ್-ಧನ್, ಆಯುಷ್ಮಾನ್ ಭಾರತ್`,
        spokenText: "ನಿಮಗೆ ಯಾವ ಯೋಜನೆಗಳು ಸೂಕ್ತವೆಂದು ತಿಳಿಯಲು ನಮ್ಮ ಅರ್ಹತೆ ಪರಿಶೀಲಕ ಸಾಧನವನ್ನು ಬಳಸಿ. ನಿಮ್ಮ ವಯಸ್ಸು, ಉದ್ಯೋಗ ಮತ್ತು ಆದಾಯ ನಮೂದಿಸಿದರೆ ತಕ್ಷಣ ಫಲಿತಾಂಶ ಸಿಗುತ್ತದೆ.",
        links: [
          { label: "ಅರ್ಹತೆ ಪರಿಶೀಲಕ ಸಾಧನಕ್ಕೆ ಹೋಗಿ", url: "#eligibility" }
        ],
        action: { label: "ಅರ್ಹತೆ ಪರಿಶೀಲಕ ತೆರೆಯಿರಿ", scrollId: "eligibility" }
      };
    } else {
      return {
        text: `To discover the exact schemes suited to your individual circumstances, try our interactive **Eligibility Checker**!\n\nSimply select your age, state, occupation, and family income bracket to calculate matching schemes in real-time.\n\nQuick Categories:\n• **Farmers:** PM-KISAN, PMFBY Crop Insurance, KCC\n• **Women:** Gruha Lakshmi, Shakti Free Bus, Ujjwala, PMMVY\n• **Students:** Central Sector Scholarships, SSP Karnataka, Vidyasiri\n• **Workers:** PM-SYM Pension, Ayushman Bharat Health Cover, PMSBY`,
        spokenText: "To see which schemes you are eligible for, use our interactive Eligibility Checker. It instantly matches your age, occupation, and income to relevant government schemes.",
        links: [
          { label: "Go to Eligibility Checker", url: "#eligibility" }
        ],
        action: { label: "Open Eligibility Checker", scrollId: "eligibility" }
      };
    }
  }

  // Default fallback answer
  if (isKn) {
    return {
      text: `ಸ್ಕೀಮ್ ಕನೆಕ್ಟ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸರ್ಕಾರದ 30+ ಪರಿಶೀಲಿಸಿದ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳಿವೆ.\n\nನೀವು ಕೃಷಿ, ಶಿಕ್ಷಣ, ಆರೋಗ್ಯ, ವಸತಿ, ಮಹಿಳಾ ಸಬಲೀಕರಣ, ಉದ್ಯೋಗ ಅಥವಾ ಪಿಂಚಣಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ವಿವರವಾದ ಪರಿಶೀಲನೆಗಾಗಿ ನಮ್ಮ **'ಎಲ್ಲಾ ಯೋಜನೆಗಳು'** ಅಥವಾ **'ಅರ್ಹತೆ ಪರಿಶೀಲಕ'** ವಿಭಾಗವನ್ನು ನೋಡಿ.`,
      spokenText: "ಸ್ಕೀಮ್ ಕನೆಕ್ಟ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೀವು ರೈತರ, ಮಹಿಳೆಯರ, ವಿದ್ಯಾರ್ಥಿಗಳ ಮತ್ತು ವಸತಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ನಾನು ನಿಮಗೆ ಮಾಹಿತಿ ನೀಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ.",
      links: [
        { label: "ಎಲ್ಲಾ ಯೋಜನೆಗಳ ಪಟ್ಟಿ", url: "#all-schemes" },
        { label: "ಅರ್ಹತೆ ಪರಿಶೀಲಕ", url: "#eligibility" }
      ]
    };
  } else {
    return {
      text: `Scheme Connect features over 30 verified Central and State welfare programs across 9 core sectors.\n\nYou can ask me about **farming subsidies, student scholarships, women empowerment, health insurance, housing assistance, or unorganised worker pensions**. You can also check our **Eligibility Checker** to find schemes matching your profile!`,
      spokenText: "Scheme Connect features over 30 verified welfare programs. You can ask me about farmer schemes, scholarships, housing, health, or women welfare.",
      links: [
        { label: "Browse All Schemes", url: "#all-schemes" },
        { label: "Check Your Eligibility", url: "#eligibility" }
      ]
    };
  }
}

// Render Chat Messages
function renderChatMessages() {
  const container = document.getElementById('assistant-messages-body');
  if (!container) return;

  container.innerHTML = ASSISTANT_STATE.chatHistory.map((msg, idx) => {
    const isUser = msg.sender === 'user';
    return `
      <div class="chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'}">
        <div class="bubble-header">
          <strong>${isUser ? (ASSISTANT_STATE.language === 'kn' ? 'ನೀವು' : 'You') : 'Scheme Connect Assistant'}</strong>
          <span class="bubble-time">${escapeHtml(msg.timestamp)}</span>
        </div>
        <div class="bubble-content">
          ${formatMarkdown(msg.text)}
        </div>
        ${!isUser && msg.links && msg.links.length > 0 ? `
          <div class="bubble-links">
            ${msg.links.map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="assistant-chip-link">${escapeHtml(l.label)} &rarr;</a>`).join('')}
          </div>
        ` : ''}
        ${!isUser && msg.action ? `
          <div style="margin-top: 0.5rem;">
            <button type="button" class="btn btn-outline btn-sm" onclick="handleAssistantAction('${msg.action.filter || ''}', '${msg.action.scrollId || ''}')" style="font-size: 0.78rem; padding: 0.25rem 0.6rem;">
              ${escapeHtml(msg.action.label)}
            </button>
          </div>
        ` : ''}
        ${!isUser ? `
          <div class="bubble-footer">
            <button type="button" class="speak-btn-inline" onclick="speakResponse('${escapeHtmlForAttr(msg.spokenText || msg.text)}')" title="Replay voice">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span>${ASSISTANT_STATE.language === 'kn' ? 'ಆಲಿಸಿ' : 'Listen'}</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function handleAssistantAction(categoryFilter, scrollId) {
  if (categoryFilter) {
    window.filterByCategory(categoryFilter);
  } else if (scrollId) {
    document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollChatToBottom() {
  const container = document.getElementById('assistant-messages-body');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function updateAssistantUIState() {
  const micBtn = document.getElementById('assistant-mic-input-btn');
  const floatingMicBtn = document.getElementById('floating-assistant-btn');
  const statusLabel = document.getElementById('assistant-listening-status');

  if (ASSISTANT_STATE.isListening) {
    micBtn?.classList.add('recording-pulse');
    floatingMicBtn?.classList.add('recording-pulse');
    if (statusLabel) {
      statusLabel.textContent = ASSISTANT_STATE.language === 'kn' ? TRANSLATIONS.kn.assistant_listening : TRANSLATIONS.en.assistant_listening;
      statusLabel.style.display = 'block';
    }
  } else {
    micBtn?.classList.remove('recording-pulse');
    floatingMicBtn?.classList.remove('recording-pulse');
    if (statusLabel) {
      statusLabel.style.display = 'none';
    }
  }
}

function updateSpeakingIndicator(isSpeaking) {
  const speakIndicator = document.getElementById('assistant-speaking-wave');
  if (speakIndicator) {
    speakIndicator.style.display = isSpeaking ? 'flex' : 'none';
  }
}

// Format simple bold markdown in assistant chat
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function escapeHtmlForAttr(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

// UI Event Listeners for Assistant Drawer
document.addEventListener('DOMContentLoaded', () => {
  initAssistantEngine();

  const floatingBtn = document.getElementById('floating-assistant-btn');
  const drawer = document.getElementById('assistant-chat-drawer');
  const closeBtn = document.getElementById('btn-close-assistant');
  const sendBtn = document.getElementById('btn-assistant-send');
  const inputField = document.getElementById('assistant-text-input');
  const micInputBtn = document.getElementById('assistant-mic-input-btn');
  const clearChatBtn = document.getElementById('btn-clear-chat');
  const muteBtn = document.getElementById('btn-assistant-mute');
  const langToggleBtn = document.getElementById('btn-assistant-lang');

  // Toggle Assistant Window
  floatingBtn?.addEventListener('click', () => {
    ASSISTANT_STATE.isOpen = !ASSISTANT_STATE.isOpen;
    drawer?.classList.toggle('active', ASSISTANT_STATE.isOpen);
    if (ASSISTANT_STATE.isOpen) {
      renderChatMessages();
      scrollChatToBottom();
      inputField?.focus();
    } else {
      stopSpeaking();
    }
  });

  closeBtn?.addEventListener('click', () => {
    ASSISTANT_STATE.isOpen = false;
    drawer?.classList.remove('active');
    stopSpeaking();
  });

  // Mic Button Click
  micInputBtn?.addEventListener('click', () => {
    toggleMicrophone();
  });

  // Send Text Message
  function submitText() {
    if (inputField && inputField.value.trim()) {
      handleUserQuery(inputField.value);
      inputField.value = '';
    }
  }

  sendBtn?.addEventListener('click', submitText);
  inputField?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitText();
  });

  // Clear Chat
  clearChatBtn?.addEventListener('click', () => {
    stopSpeaking();
    ASSISTANT_STATE.chatHistory = [];
    loadWelcomeMessage();
    renderChatMessages();
    showToast(ASSISTANT_STATE.language === 'kn' ? 'ಸಂಭಾಷಣೆ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ' : 'Chat history cleared');
  });

  // Mute / Unmute
  muteBtn?.addEventListener('click', () => {
    ASSISTANT_STATE.isMuted = !ASSISTANT_STATE.isMuted;
    if (ASSISTANT_STATE.isMuted) stopSpeaking();
    muteBtn.innerHTML = ASSISTANT_STATE.isMuted
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg><span>${ASSISTANT_STATE.language === 'kn' ? 'ಧ್ವನಿ ಆಫ್' : 'Muted'}</span>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg><span>${ASSISTANT_STATE.language === 'kn' ? 'ಧ್ವನಿ ಆನ್' : 'Voice On'}</span>`;
  });

  // Language switch inside assistant
  langToggleBtn?.addEventListener('click', () => {
    const nextLang = ASSISTANT_STATE.language === 'en' ? 'kn' : 'en';
    if (typeof window.setLanguage === 'function') {
      window.setLanguage(nextLang, true);
    } else {
      ASSISTANT_STATE.language = nextLang;
      langToggleBtn.textContent = ASSISTANT_STATE.language === 'en' ? 'EN | ಕನ್ನಡ' : 'ಕನ್ನಡ | EN';
      if (inputField) {
        inputField.placeholder = ASSISTANT_STATE.language === 'kn' ? TRANSLATIONS.kn.assistant_input_placeholder : TRANSLATIONS.en.assistant_input_placeholder;
      }
      renderSuggestedQuestions();
    }
  });

  // Suggested Questions click
  renderSuggestedQuestions();
});

function renderSuggestedQuestions() {
  const container = document.getElementById('assistant-suggested-pills');
  if (!container) return;

  const isKn = ASSISTANT_STATE.language === 'kn';
  const questions = isKn ? [
    "ರೈತರಿಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?",
    "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಯಾವ ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು ಲಭ್ಯವಿವೆ?",
    "ನನಗೆ ವಸತಿ ಯೋಜನೆ ಲಭ್ಯವಿದೆಯೇ?",
    "ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?",
    "ಮಹಿಳೆಯರು ಆರ್ಥಿಕ ನೆರವಿಗೆ ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು?",
    "ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?"
  ] : [
    "Which government schemes are available for farmers?",
    "What scholarships are available for students?",
    "Am I eligible for any housing scheme?",
    "What documents are required for this scheme?",
    "How can women apply for government financial assistance?",
    "What schemes are available for daily wage workers?"
  ];

  container.innerHTML = questions.map(q => `
    <button type="button" class="assistant-pill-btn" onclick="handleUserQuery('${escapeHtmlForAttr(q)}')">
      ${escapeHtml(q)}
    </button>
  `).join('');
}
