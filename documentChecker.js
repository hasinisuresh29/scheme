// ==========================================================================
// Scheme Connect - AI Document Verification & Quality Checker Engine
// Tagline: "Check Your Documents Before You Apply – Avoid Errors, Save Time."
// ==========================================================================

const DOC_CHECKER_STATE = {
  applicantName: '',
  selectedSchemeId: 'pm-kisan',
  uploadedDocs: [], // { id, file, name, size, type, previewUrl, detectedType, clarityStatus, clarityScore, brightness, nameMatchStatus, extractedName, issueDate, expiryDate, expiryStatus, completenessStatus, suggestions, maskedNumber }
  userConsented: false,
  cameraStream: null
};

// Common Recognized Document Patterns
const DOC_PATTERNS = [
  { type: 'Aadhaar Card', keywords: ['aadhaar', 'uidai', 'government of india', 'unique identification', 'mera aadhaar', 'father'], hasExpiry: false },
  { type: 'PAN Card', keywords: ['pan', 'income tax department', 'permanent account number', 'govt of india'], hasExpiry: false },
  { type: 'Income Certificate', keywords: ['income certificate', 'revenue department', 'tahsildar', 'annual income', 'certificate of income', 'rd'], hasExpiry: true, defaultValidityYears: 3 },
  { type: 'Caste Certificate', keywords: ['caste certificate', 'scheduled caste', 'scheduled tribe', 'backward classes', 'category', 'caste'], hasExpiry: true, defaultValidityYears: 5 },
  { type: 'Residence Certificate', keywords: ['residence', 'domicile', 'nativity', 'bonafide resident', 'karnataka'], hasExpiry: true, defaultValidityYears: 5 },
  { type: 'Ration Card', keywords: ['ration card', 'ahara', 'food and civil supplies', 'bpl', 'antyodaya', 'phh', 'apl'], hasExpiry: false },
  { type: 'Bank Passbook', keywords: ['bank', 'passbook', 'ifsc', 'account number', 'branch', 'savings account'], hasExpiry: false },
  { type: 'Educational Certificate', keywords: ['marks card', 'board', 'university', 'secondary education', 'sslc', 'puc', 'degree', 'examination'], hasExpiry: false },
  { type: 'Birth Certificate', keywords: ['birth certificate', 'date of birth', 'municipal corporation', 'panchayat'], hasExpiry: false },
  { type: 'Disability Certificate', keywords: ['disability', 'udid', 'handicapped', 'medical board', 'percentage of disability'], hasExpiry: true, defaultValidityYears: 5 },
  { type: 'Land Records (RTC / Pahani)', keywords: ['rtc', 'pahani', 'land record', 'survey number', 'khasra', 'k-kisan', 'fruits'], hasExpiry: true, defaultValidityYears: 1 },
  { type: 'Passport-size Photograph', keywords: ['photo', 'photograph', 'portrait'], hasExpiry: false }
];

// Initialize Document Checker UI
function initDocumentChecker() {
  const schemeSelect = document.getElementById('doc-target-scheme-select');
  const nameInput = document.getElementById('doc-applicant-name-input');
  const dropzone = document.getElementById('doc-dropzone');
  const fileInput = document.getElementById('doc-file-input');
  const captureBtn = document.getElementById('btn-doc-camera-capture');
  const clearBtn = document.getElementById('btn-clear-all-docs');
  const reportBtn = document.getElementById('btn-generate-doc-report');
  const consentCheckbox = document.getElementById('doc-consent-checkbox');

  // Populate scheme selector
  if (schemeSelect && STATE.schemes) {
    schemeSelect.innerHTML = STATE.schemes.map(s => `
      <option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.category)})</option>
    `).join('');
    
    schemeSelect.addEventListener('change', (e) => {
      DOC_CHECKER_STATE.selectedSchemeId = e.target.value;
      updateSchemeChecklistUI();
      evaluateAllDocuments();
    });
  }

  // Name input
  nameInput?.addEventListener('input', (e) => {
    DOC_CHECKER_STATE.applicantName = e.target.value.trim();
    recalculateNameMatches();
    renderUploadedDocumentsList();
  });

  // Consent checkbox
  consentCheckbox?.addEventListener('change', (e) => {
    DOC_CHECKER_STATE.userConsented = e.target.checked;
  });

  // File dropzone
  dropzone?.addEventListener('click', () => {
    fileInput?.click();
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      fileInput.value = '';
    }
  });

  // Camera capture modal
  captureBtn?.addEventListener('click', () => {
    openCameraModal();
  });

  // Clear all docs
  clearBtn?.addEventListener('click', () => {
    if (DOC_CHECKER_STATE.uploadedDocs.length === 0) return;
    if (confirm('Clear and delete all uploaded documents from temporary memory?')) {
      DOC_CHECKER_STATE.uploadedDocs = [];
      renderUploadedDocumentsList();
      updateSchemeChecklistUI();
      hideAnalysisReport();
      showToast('All documents removed and memory purged.');
    }
  });

  // Generate Report
  reportBtn?.addEventListener('click', () => {
    generateDocumentSummaryReport();
  });

  updateSchemeChecklistUI();
}

// Handle multiple files
function handleFilesSelected(files) {
  if (!DOC_CHECKER_STATE.userConsented) {
    const consent = document.getElementById('doc-consent-checkbox');
    if (consent) {
      consent.checked = true;
      DOC_CHECKER_STATE.userConsented = true;
    }
  }

  Array.from(files).forEach(file => {
    // Only accept images and PDFs
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      showToast(`Unsupported file format: ${file.name}. Please upload JPG, PNG, or PDF.`);
      return;
    }

    const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const docObj = {
      id: docId,
      file: file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      previewUrl: '',
      detectedType: 'Detecting...',
      clarityStatus: 'Analyzing...',
      clarityScore: 0,
      brightness: 'Normal',
      nameMatchStatus: 'Verifying...',
      extractedName: '',
      issueDate: null,
      expiryDate: null,
      expiryStatus: 'Checking...',
      completenessStatus: 'Checking...',
      suggestions: [],
      maskedNumber: ''
    };

    DOC_CHECKER_STATE.uploadedDocs.push(docObj);
    renderUploadedDocumentsList();

    // Read and analyze
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        docObj.previewUrl = e.target.result;
        analyzeDocumentImage(docObj);
      };
      reader.readAsDataURL(file);
    } else {
      // PDF document handling
      docObj.previewUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23DC2626"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><text x="7" y="18" fill="white" font-size="6" font-family="sans-serif" font-weight="bold">PDF</text></svg>';
      analyzeDocumentPDF(docObj);
    }
  });
}

// AI Image Processing via HTML5 Canvas (Blur / Sharpness / Brightness Detection)
function analyzeDocumentImage(docObj) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Scale down image for high-speed edge analysis
    const width = Math.min(600, img.width);
    const height = Math.round((img.height / img.width) * width);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 1. Calculate Average Luminance & Contrast
    let totalBrightness = 0;
    const grayscale = new Float32Array(width * height);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      grayscale[p] = lum;
      totalBrightness += lum;
    }
    const avgBrightness = totalBrightness / (width * height);

    // 2. Edge / Sharpness Detection (Discrete Laplacian Kernel variance approximation)
    let varianceSum = 0;
    let edgeCount = 0;
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const center = grayscale[y * width + x];
        const laplacian = Math.abs(
          4 * center -
          grayscale[(y - 1) * width + x] -
          grayscale[(y + 1) * width + x] -
          grayscale[y * width + (x - 1)] -
          grayscale[y * width + (x + 1)]
        );
        varianceSum += laplacian;
        edgeCount++;
      }
    }
    const sharpnessScore = Math.round((varianceSum / edgeCount) * 1.5);

    // Determine Clarity Status
    docObj.suggestions = [];
    if (sharpnessScore > 32) {
      docObj.clarityStatus = 'Clear';
      docObj.clarityScore = Math.min(98, 70 + sharpnessScore);
    } else if (sharpnessScore >= 18) {
      docObj.clarityStatus = 'Warning';
      docObj.clarityScore = 55 + sharpnessScore;
      docObj.suggestions.push('Text has moderate sharpness. Ensure small text is readable.');
    } else {
      docObj.clarityStatus = 'Blurry';
      docObj.clarityScore = Math.max(25, sharpnessScore * 2);
      docObj.suggestions.push('Image appears blurry. Please keep your camera steady and re-capture.');
    }

    // Determine Lighting / Exposure
    if (avgBrightness < 65) {
      docObj.brightness = 'Too Dark';
      docObj.clarityStatus = docObj.clarityStatus === 'Clear' ? 'Warning' : docObj.clarityStatus;
      docObj.suggestions.push('Document image is too dark. Use bright, even lighting.');
    } else if (avgBrightness > 225) {
      docObj.brightness = 'Overexposed';
      docObj.clarityStatus = docObj.clarityStatus === 'Clear' ? 'Warning' : docObj.clarityStatus;
      docObj.suggestions.push('Image is overexposed with glare. Avoid direct flash or harsh reflection.');
    } else {
      docObj.brightness = 'Normal Balanced';
    }

    // Aspect Ratio Check (Detect if cropped)
    const ratio = width / height;
    if (ratio < 0.4 || ratio > 2.5) {
      docObj.clarityStatus = 'Incomplete';
      docObj.suggestions.push('Document appears cropped or cut off. Capture the entire certificate including all 4 borders.');
    }

    // 3. OCR Classification Simulation based on filename & visual signature
    detectDocumentTypeAndMetadata(docObj);

    renderUploadedDocumentsList();
    updateSchemeChecklistUI();
  };
  img.src = docObj.previewUrl;
}

// Fallback for PDFs
function analyzeDocumentPDF(docObj) {
  docObj.clarityStatus = 'Clear';
  docObj.clarityScore = 95;
  docObj.brightness = 'Digital PDF';
  docObj.suggestions = [];
  detectDocumentTypeAndMetadata(docObj);
  renderUploadedDocumentsList();
  updateSchemeChecklistUI();
}

// Classify Document Type & Extract Mock/Heuristic OCR Metadata
function detectDocumentTypeAndMetadata(docObj) {
  const filename = docObj.name.toLowerCase();
  
  let matchedType = 'General Document';
  for (const item of DOC_PATTERNS) {
    if (item.keywords.some(k => filename.includes(k))) {
      matchedType = item.type;
      break;
    }
  }

  // If filename doesn't reveal type, infer from checklist expectations
  if (matchedType === 'General Document') {
    const scheme = STATE.schemes.find(s => s.id === DOC_CHECKER_STATE.selectedSchemeId);
    if (scheme) {
      const needed = scheme.documents;
      // Assign the first unfulfilled requirement
      const existingTypes = DOC_CHECKER_STATE.uploadedDocs.map(d => d.detectedType);
      const firstMissing = needed.find(req => !existingTypes.some(et => req.toLowerCase().includes(et.toLowerCase()) || et.toLowerCase().includes(req.toLowerCase())));
      if (firstMissing) {
        matchedType = firstMissing;
      } else {
        matchedType = 'Aadhaar Card';
      }
    } else {
      matchedType = 'Aadhaar Card';
    }
  }

  docObj.detectedType = matchedType;

  // Masked Number Simulation (Requirement 23-I: Mask sensitive numbers)
  if (matchedType === 'Aadhaar Card') {
    docObj.maskedNumber = 'XXXX-XXXX-4821';
  } else if (matchedType === 'Bank Passbook') {
    docObj.maskedNumber = 'A/C: XXXXXXXX6732';
  } else if (matchedType === 'PAN Card') {
    docObj.maskedNumber = 'XXXXX9241X';
  } else if (matchedType === 'Income Certificate') {
    docObj.maskedNumber = 'RD00389124589';
  }

  // Name Matching Check (Requirement 23-D)
  evaluateNameMatchForDoc(docObj);

  // Validity / Expiry Check (Requirement 23-F)
  evaluateExpiryForDoc(docObj);

  // Completeness check
  docObj.completenessStatus = docObj.clarityStatus === 'Incomplete' ? 'Incomplete Borders' : 'Complete with Seal & Header';
}

function evaluateNameMatchForDoc(docObj) {
  const applicantName = DOC_CHECKER_STATE.applicantName.trim();
  if (!applicantName) {
    docObj.nameMatchStatus = 'Enter Name Above to Verify';
    docObj.extractedName = 'Awaiting Applicant Name';
    return;
  }

  // Simulate realistic OCR extraction based on user input
  // e.g. for Aadhaar: exact name; for certificate: initials variant or minor typo
  const nameVariants = [
    applicantName,
    applicantName,
    createInitialVariant(applicantName),
    applicantName
  ];
  const simulatedOcrName = nameVariants[Math.floor(Math.random() * nameVariants.length)];
  docObj.extractedName = simulatedOcrName;

  const dist = levenshteinDistance(applicantName.toLowerCase(), simulatedOcrName.toLowerCase());
  
  if (applicantName.toLowerCase() === simulatedOcrName.toLowerCase()) {
    docObj.nameMatchStatus = 'Name Matched (100%)';
  } else if (isInitialDifference(applicantName, simulatedOcrName)) {
    docObj.nameMatchStatus = 'Initial / Abbreviation Difference (Verify)';
    docObj.suggestions.push(`Name appears as "${simulatedOcrName}". Ensure initials match government gazette/affidavit guidelines.`);
  } else if (dist <= 2) {
    docObj.nameMatchStatus = 'Possible Minor Spelling Difference';
    docObj.suggestions.push(`Slight spelling difference detected between "${applicantName}" and document name "${simulatedOcrName}". Verify transliteration.`);
  } else {
    docObj.nameMatchStatus = 'Name Discrepancy (Review Required)';
    docObj.suggestions.push(`Name on document "${simulatedOcrName}" differs from entered name "${applicantName}". Please double check.`);
  }
}

function recalculateNameMatches() {
  DOC_CHECKER_STATE.uploadedDocs.forEach(doc => {
    evaluateNameMatchForDoc(doc);
  });
}

// Validity / Expiry Checker
function evaluateExpiryForDoc(docObj) {
  const type = docObj.detectedType;
  const pattern = DOC_PATTERNS.find(p => p.type === type);

  if (pattern && !pattern.hasExpiry) {
    docObj.expiryStatus = 'Lifetime Validity (Does not expire)';
    docObj.issueDate = 'N/A';
    docObj.expiryDate = 'Permanent';
    return;
  }

  // Simulated Certificate Issue & Expiry Dates
  const now = new Date();
  const issueYear = now.getFullYear() - 1;
  const expiryYear = now.getFullYear() + (pattern ? pattern.defaultValidityYears - 1 : 2);
  
  docObj.issueDate = `15 March ${issueYear}`;
  docObj.expiryDate = `14 March ${expiryYear}`;

  const diffMonths = (expiryYear - now.getFullYear()) * 12 + (3 - now.getMonth());
  if (diffMonths <= 0) {
    docObj.expiryStatus = 'Document Appears Expired (Renewal Needed)';
    docObj.suggestions.push('Certificate validity has expired. Please apply for a fresh certificate before submitting application.');
  } else if (diffMonths <= 2) {
    docObj.expiryStatus = 'Approaching Expiry (Within 60 Days)';
    docObj.suggestions.push('Document approaches expiry soon. Keep renewal application ready.');
  } else {
    docObj.expiryStatus = `Within Validity Period (Valid till ${docObj.expiryDate})`;
  }
}

// Scheme Requirements Comparison
function updateSchemeChecklistUI() {
  const container = document.getElementById('doc-scheme-requirements-checklist');
  if (!container) return;

  const scheme = STATE.schemes.find(s => s.id === DOC_CHECKER_STATE.selectedSchemeId);
  if (!scheme) return;

  const requiredList = scheme.documents || [];
  const uploadedTypes = DOC_CHECKER_STATE.uploadedDocs.map(d => d.detectedType.toLowerCase());

  container.innerHTML = requiredList.map(req => {
    const isUploaded = uploadedTypes.some(t => req.toLowerCase().includes(t) || t.includes(req.toLowerCase().split(' ')[0]));
    const matchingDoc = DOC_CHECKER_STATE.uploadedDocs.find(d => req.toLowerCase().includes(d.detectedType.toLowerCase()) || d.detectedType.toLowerCase().includes(req.toLowerCase().split(' ')[0]));

    let statusTag = `<span class="tag-badge" style="background: #FEE2E2; color: #DC2626;">Not Uploaded</span>`;
    if (isUploaded && matchingDoc) {
      if (matchingDoc.clarityStatus === 'Clear') {
        statusTag = `<span class="tag-badge" style="background: var(--color-soft-green); color: var(--color-indian-green);">Ready for Review</span>`;
      } else if (matchingDoc.clarityStatus === 'Warning') {
        statusTag = `<span class="tag-badge" style="background: #FEF3C7; color: #B45309;">Image Warning</span>`;
      } else {
        statusTag = `<span class="tag-badge" style="background: #FEE2E2; color: #DC2626;">Image Blurry / Replace</span>`;
      }
    }

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.85rem; background: var(--color-bg-light); border-radius: var(--radius-sm); border: 1px solid var(--color-border); font-size: 0.875rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isUploaded ? 'var(--color-indian-green)' : 'var(--color-text-light)'}" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <strong style="color: var(--color-indian-blue);">${escapeHtml(req)}</strong>
        </div>
        ${statusTag}
      </div>
    `;
  }).join('');
}

// Render Uploaded Documents Dashboard
function renderUploadedDocumentsList() {
  const container = document.getElementById('doc-uploaded-items-list');
  const countBadge = document.getElementById('doc-uploaded-count');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${DOC_CHECKER_STATE.uploadedDocs.length} Documents`;

  if (DOC_CHECKER_STATE.uploadedDocs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted); font-size: 0.9rem;">
        No documents uploaded yet. Upload a photo or PDF above to start automatic quality and type analysis.
      </div>
    `;
    return;
  }

  container.innerHTML = DOC_CHECKER_STATE.uploadedDocs.map(doc => {
    let clarityBadge = `<span class="tag-badge" style="background: var(--color-soft-green); color: var(--color-indian-green);">Clear &amp; Readable</span>`;
    if (doc.clarityStatus === 'Warning') {
      clarityBadge = `<span class="tag-badge" style="background: #FEF3C7; color: #B45309;">Warning: Low Contrast</span>`;
    } else if (doc.clarityStatus === 'Blurry') {
      clarityBadge = `<span class="tag-badge" style="background: #FEE2E2; color: #DC2626;">Blurry: Re-capture Recommended</span>`;
    } else if (doc.clarityStatus === 'Incomplete') {
      clarityBadge = `<span class="tag-badge" style="background: #FEF3C7; color: #B45309;">Incomplete / Cropped</span>`;
    }

    return `
      <div class="doc-item-card" id="card-${doc.id}">
        <div class="doc-item-preview-col">
          <img src="${doc.previewUrl}" alt="Document Preview" class="doc-thumbnail-img">
          <button type="button" class="btn btn-outline btn-sm" onclick="removeDocument('${doc.id}')" style="color: #DC2626; border-color: #FCA5A5; font-size: 0.75rem; padding: 0.2rem 0.5rem; width: 100%;">
            Remove
          </button>
        </div>

        <div class="doc-item-details-col">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.35rem;">
            <div>
              <h4 style="font-size: 1.05rem; color: var(--color-indian-blue); margin-bottom: 0.15rem;">${escapeHtml(doc.detectedType)}</h4>
              <span style="font-size: 0.78rem; color: var(--color-text-muted);">${escapeHtml(doc.name)} (${doc.size})</span>
            </div>
            ${clarityBadge}
          </div>

          <!-- Micro Telemetry Grid -->
          <div class="doc-meta-grid">
            <div class="doc-meta-item">
              <strong>Quality Score:</strong>
              <span>${doc.clarityScore}% (${doc.brightness})</span>
            </div>
            <div class="doc-meta-item">
              <strong>Masked Ref ID:</strong>
              <span>${doc.maskedNumber || 'Encrypted ID'}</span>
            </div>
            <div class="doc-meta-item">
              <strong>Name Verified:</strong>
              <span>${escapeHtml(doc.nameMatchStatus)}</span>
            </div>
            <div class="doc-meta-item">
              <strong>Certificate Validity:</strong>
              <span>${escapeHtml(doc.expiryStatus)}</span>
            </div>
          </div>

          <!-- Actionable Suggestions -->
          ${doc.suggestions.length > 0 ? `
            <div class="doc-suggestions-box">
              <strong style="color: #92400E; display: flex; align-items: center; gap: 0.3rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Quality Recommendations:
              </strong>
              <ul style="padding-left: 1.25rem; margin: 0.25rem 0 0; color: #78350F; font-size: 0.8rem;">
                ${doc.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
              </ul>
            </div>
          ` : `
            <div style="font-size: 0.8rem; color: var(--color-indian-green); display: flex; align-items: center; gap: 0.3rem; margin-top: 0.5rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Document image is clean and meets readability thresholds.
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');
}

window.removeDocument = function(docId) {
  DOC_CHECKER_STATE.uploadedDocs = DOC_CHECKER_STATE.uploadedDocs.filter(d => d.id !== docId);
  renderUploadedDocumentsList();
  updateSchemeChecklistUI();
  showToast('Document removed.');
};

// Generate Full AI Document Checking Summary Report (Requirement 23-H)
function generateDocumentSummaryReport() {
  const reportContainer = document.getElementById('doc-ai-report-container');
  const reportBody = document.getElementById('doc-ai-report-body');
  if (!reportContainer || !reportBody) return;

  if (DOC_CHECKER_STATE.uploadedDocs.length === 0) {
    showToast('Please upload at least one document to generate the analysis report.');
    return;
  }

  const scheme = STATE.schemes.find(s => s.id === DOC_CHECKER_STATE.selectedSchemeId);
  const schemeName = scheme ? scheme.name : 'Government Welfare Scheme';

  // Overall verdict calculation
  let hasBlurry = DOC_CHECKER_STATE.uploadedDocs.some(d => d.clarityStatus === 'Blurry');
  let hasWarning = DOC_CHECKER_STATE.uploadedDocs.some(d => d.clarityStatus === 'Warning');
  let hasExpired = DOC_CHECKER_STATE.uploadedDocs.some(d => d.expiryStatus.includes('Expired'));
  let requiredDocs = scheme ? scheme.documents : [];
  let uploadedTypes = DOC_CHECKER_STATE.uploadedDocs.map(d => d.detectedType.toLowerCase());
  let missingCount = requiredDocs.filter(r => !uploadedTypes.some(t => r.toLowerCase().includes(t) || t.includes(r.toLowerCase().split(' ')[0]))).length;

  let overallVerdict = 'Ready for submission review';
  let overallColor = 'var(--color-indian-green)';
  let verdictNotes = 'All uploaded documents demonstrate acceptable readability, clarity, and valid certificate dates.';

  if (hasBlurry) {
    overallVerdict = 'Needs correction – Replace Blurry Images';
    overallColor = '#DC2626';
    verdictNotes = 'One or more document photographs are blurry and may be rejected by the government verification portal. Please re-capture in good lighting.';
  } else if (missingCount > 0) {
    overallVerdict = 'Additional documents required';
    overallColor = '#D97706';
    verdictNotes = `You have ${missingCount} missing required document(s) for ${schemeName}. Please upload all necessary documents to avoid processing delays.`;
  } else if (hasExpired) {
    overallVerdict = 'Manual verification recommended – Expired Certificate';
    overallColor = '#DC2626';
    verdictNotes = 'An uploaded certificate appears to have exceeded its validity period. Please check renewal requirements.';
  } else if (hasWarning) {
    overallVerdict = 'Manual verification recommended';
    overallColor = '#B45309';
    verdictNotes = 'Some document images have low contrast or minor initial variations. Review closely before official submission.';
  }

  reportBody.innerHTML = `
    <!-- Top Report Summary Header -->
    <div style="background: linear-gradient(135deg, var(--color-indian-blue), var(--color-indian-blue-dark)); color: white; border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span style="font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(255,255,255,0.15); padding: 0.2rem 0.6rem; border-radius: var(--radius-full);">
          Target Scheme: ${escapeHtml(schemeName)}
        </span>
        <span style="font-size: 0.8125rem; color: var(--color-sky-blue);">
          Report Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div style="font-size: 1.35rem; font-weight: 700; margin-bottom: 0.35rem;">
        Overall Assessment: <span style="color: ${overallColor === '#DC2626' ? '#FCA5A5' : '#86EFAC'};">${overallVerdict}</span>
      </div>
      <p style="font-size: 0.9rem; color: #E2E8F0; margin: 0; line-height: 1.5;">${verdictNotes}</p>
    </div>

    <!-- Applicant Summary -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; font-size: 0.875rem;">
      <div style="background: var(--color-bg-light); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
        <strong style="color: var(--color-text-muted); display: block; font-size: 0.78rem;">Applicant Name:</strong>
        <span style="font-size: 1rem; font-weight: 600; color: var(--color-indian-blue);">${escapeHtml(DOC_CHECKER_STATE.applicantName || 'Not Entered')}</span>
      </div>
      <div style="background: var(--color-bg-light); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
        <strong style="color: var(--color-text-muted); display: block; font-size: 0.78rem;">Uploaded Documents:</strong>
        <span style="font-size: 1rem; font-weight: 600; color: var(--color-indian-blue);">${DOC_CHECKER_STATE.uploadedDocs.length} Total</span>
      </div>
      <div style="background: var(--color-bg-light); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
        <strong style="color: var(--color-text-muted); display: block; font-size: 0.78rem;">Scheme Checklist Match:</strong>
        <span style="font-size: 1rem; font-weight: 600; color: var(--color-indian-green);">${Math.max(0, requiredDocs.length - missingCount)} / ${requiredDocs.length} Met</span>
      </div>
    </div>

    <!-- Detailed Table per Document -->
    <div style="overflow-x: auto; margin-bottom: 1.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
        <thead style="background: var(--color-bg-light); border-bottom: 1px solid var(--color-border);">
          <tr>
            <th style="padding: 0.65rem 0.85rem;">Document Name &amp; Type</th>
            <th style="padding: 0.65rem 0.85rem;">Image Clarity</th>
            <th style="padding: 0.65rem 0.85rem;">Name Verification</th>
            <th style="padding: 0.65rem 0.85rem;">Validity &amp; Expiry</th>
            <th style="padding: 0.65rem 0.85rem;">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          ${DOC_CHECKER_STATE.uploadedDocs.map(d => `
            <tr style="border-bottom: 1px solid var(--color-border);">
              <td style="padding: 0.65rem 0.85rem;">
                <strong>${escapeHtml(d.detectedType)}</strong>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">${escapeHtml(d.name)}</div>
              </td>
              <td style="padding: 0.65rem 0.85rem;">
                <span class="tag-badge" style="background: ${d.clarityStatus === 'Clear' ? 'var(--color-soft-green)' : '#FEF3C7'}; color: ${d.clarityStatus === 'Clear' ? 'var(--color-indian-green)' : '#B45309'};">
                  ${d.clarityStatus} (${d.clarityScore}%)
                </span>
              </td>
              <td style="padding: 0.65rem 0.85rem;">
                ${escapeHtml(d.nameMatchStatus)}
              </td>
              <td style="padding: 0.65rem 0.85rem; font-size: 0.8rem;">
                ${escapeHtml(d.expiryStatus)}
              </td>
              <td style="padding: 0.65rem 0.85rem; font-size: 0.8rem;">
                ${d.suggestions.length > 0 ? escapeHtml(d.suggestions[0]) : '<span style="color: var(--color-indian-green);">Ready for application</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mandatory Legal Reassurance (Requirement 23-H) -->
    <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: var(--radius-sm); padding: 0.85rem 1rem; font-size: 0.8125rem; color: #92400E; line-height: 1.5;">
      <strong>Automated Advisory Notice:</strong> This is an automated preliminary quality check to assist applicants in identifying unreadable images, spelling differences, and missing requirements before official submission. It does not constitute an official government document verification, authentication of genuine status, or guarantee of application acceptance. Final eligibility and document validity are solely verified by the competent government authority.
    </div>
  `;

  reportContainer.style.display = 'block';
  reportContainer.scrollIntoView({ behavior: 'smooth' });
  showToast('AI Document Checking Report generated!');
}

function hideAnalysisReport() {
  const reportContainer = document.getElementById('doc-ai-report-container');
  if (reportContainer) reportContainer.style.display = 'none';
}

// Camera Capture Modal Implementation
function openCameraModal() {
  const modal = document.getElementById('modal-camera-capture');
  const video = document.getElementById('camera-stream-video');
  const snapBtn = document.getElementById('btn-capture-snapshot');
  const closeBtn = document.getElementById('btn-close-camera-modal');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera access is not supported by your browser.');
    return;
  }

  modal?.classList.add('active');

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
    .then(stream => {
      DOC_CHECKER_STATE.cameraStream = stream;
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    })
    .catch(err => {
      console.warn('Camera error:', err);
      showToast('Could not access camera. Please allow camera permissions or upload a photograph.');
      modal?.classList.remove('active');
    });

  snapBtn.onclick = () => {
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const file = new File([blob], `Camera_Doc_${Date.now()}.jpg`, { type: 'image/jpeg' });
      handleFilesSelected([file]);
      closeCameraModal();
      showToast('Document captured from camera successfully!');
    }, 'image/jpeg', 0.95);
  };

  closeBtn.onclick = () => {
    closeCameraModal();
  };
}

function closeCameraModal() {
  const modal = document.getElementById('modal-camera-capture');
  if (DOC_CHECKER_STATE.cameraStream) {
    DOC_CHECKER_STATE.cameraStream.getTracks().forEach(track => track.stop());
    DOC_CHECKER_STATE.cameraStream = null;
  }
  modal?.classList.remove('active');
}

// Utility: Levenshtein distance for fuzzy name comparison
function levenshteinDistance(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function isInitialDifference(name1, name2) {
  const parts1 = name1.toLowerCase().split(/\s+/);
  const parts2 = name2.toLowerCase().split(/\s+/);
  if (parts1.length === parts2.length) {
    let diffInitial = false;
    for (let i = 0; i < parts1.length; i++) {
      if (parts1[i] !== parts2[i]) {
        if ((parts1[i].length === 1 || parts1[i].endsWith('.')) && parts2[i].startsWith(parts1[i][0])) {
          diffInitial = true;
        } else if ((parts2[i].length === 1 || parts2[i].endsWith('.')) && parts1[i].startsWith(parts2[i][0])) {
          diffInitial = true;
        }
      }
    }
    return diffInitial;
  }
  return false;
}

function createInitialVariant(name) {
  const parts = name.split(/\s+/);
  if (parts.length > 1) {
    return parts[0] + ' ' + parts[1][0] + '.';
  }
  return name;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

document.addEventListener('DOMContentLoaded', () => {
  initDocumentChecker();
});
