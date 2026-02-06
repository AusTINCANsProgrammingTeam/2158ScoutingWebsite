const API_URL = "https://api-2sv4ordija-uc.a.run.app";
const CONFIG_PATH = "../configs/";

let currentValidation = null;
let currentEventKey = null;
let currentDataPath = null;
let currentFilter = 'all';
let editingEntry = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfigs();
    setupEventListeners();
});

async function loadConfigs() {
    try {
        const response = await fetch(`${CONFIG_PATH}configs.json`);
        const data = await response.json();
        
        const configSelect = document.getElementById('configSelect');
        configSelect.innerHTML = data.configs.map(config =>
            `<option value="${config.file}">${config.name}</option>`
        ).join('');

        await loadEventSelect();
    } catch (error) {
        console.error('Error loading configs:', error);
        alert('Failed to load configurations');
    }
}

async function loadEventSelect() {
    try {
        const configFile = document.getElementById('configSelect').value;
        const response = await fetch(`${CONFIG_PATH}${configFile}`);
        const config = await response.json();

        const eventSelect = document.getElementById('eventSelect');
        eventSelect.innerHTML = config.refs.map(ref =>
            `<option value="${ref.ref}" data-event="${ref.name}">${ref.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function setupEventListeners() {
    document.getElementById('configSelect').addEventListener('change', loadEventSelect);
    document.getElementById('runValidationBtn').addEventListener('click', runValidation);
    document.getElementById('refreshBtn').addEventListener('click', runValidation);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderEntries();
        });
    });
}

async function runValidation() {
    const eventRef = document.getElementById('eventSelect').value;
    if (!eventRef) {
        alert('Please select an event');
        return;
    }

    currentDataPath = eventRef;
    const [year, eventCode] = eventRef.split('/');
    
    showLoading(true);

    try {
        const [validationRes, eventInfoRes] = await Promise.all([
            fetch(`${API_URL}/audit-validation?event=${year}${eventCode}&dataPath=${eventRef}&year=${year}`),
            fetch(`${API_URL}/audit-event-info?event=${year}${eventCode}&year=${year}`)
        ]);

        const validation = await validationRes.json();
        const eventInfo = await eventInfoRes.json();

        if (validation.success) {
            currentValidation = validation.validation;
            displayEventInfo(eventInfo);
            renderSummary();
            renderEntries();
            showLoading(false);
        } else {
            alert('Validation failed: ' + validation.error);
            showLoading(false);
        }
    } catch (error) {
        console.error('Validation error:', error);
        alert('Error running validation: ' + error.message);
        showLoading(false);
    }
}

function displayEventInfo(eventInfo) {
    if (eventInfo.success) {
        document.getElementById('eventInfo').style.display = 'block';
        document.getElementById('eventName').textContent = eventInfo.info?.name || 'Unknown';
        document.getElementById('teamCount').textContent = eventInfo.teamCount;
        document.getElementById('matchCount').textContent = eventInfo.matchCount;
    }
}

function renderSummary() {
    if (!currentValidation) return;

    const { total, valid, invalid } = currentValidation;
    const warnings = currentValidation.entries.reduce((sum, e) => sum + e.warnings.length, 0);

    document.getElementById('totalEntries').textContent = total;
    document.getElementById('validCount').textContent = valid;
    document.getElementById('invalidCount').textContent = invalid;
    document.getElementById('warningCount').textContent = warnings;

    document.getElementById('summarySection').style.display = 'block';
}

function renderEntries() {
    if (!currentValidation) return;

    const container = document.getElementById('entriesContainer');
    let entries = currentValidation.entries;

    if (currentFilter === 'errors') {
        entries = entries.filter(e => e.issues.length > 0);
    } else if (currentFilter === 'warnings') {
        entries = entries.filter(e => e.warnings.length > 0);
    } else if (currentFilter === 'valid') {
        entries = entries.filter(e => e.isValid && e.warnings.length === 0);
    }

    container.innerHTML = entries.map(entry => `
        <div class="entry-card ${entry.isValid ? 'valid' : entry.issues.length > 0 ? 'has-errors' : 'has-warnings'}">
            <div class="entry-header">
                <h4 class="entry-title">Team ${entry.teamNumber} - Match ${entry.matchNumber}</h4>
                <span class="badge-status ${entry.isValid ? 'valid' : entry.issues.length > 0 ? 'error' : 'warning'}">
                    ${entry.isValid && entry.warnings.length === 0 ? '✓ Valid' : entry.issues.length > 0 ? '✕ Invalid' : '⚠ Warning'}
                </span>
            </div>
            
            <div class="entry-meta">
                <span>📅 ${new Date(entry.timestamp).toLocaleString()}</span>
                ${entry.issues.length > 0 ? `<span>ISSUE: ${entry.issues.length} error${entry.issues.length !== 1 ? 's' : ''}</span>` : ''}
                ${entry.warnings.length > 0 ? `<span>WARNING: ${entry.warnings.length} warning${entry.warnings.length !== 1 ? 's' : ''}</span>` : ''}
            </div>

            ${entry.issues.length > 0 || entry.warnings.length > 0 ? `
                <div class="issues-list">
                    ${entry.issues.map(issue => `
                        <div class="issue error">
                            <div class="issue-icon">✕</div>
                            <div class="issue-text">
                                <span class="issue-field">${issue.field}:</span> ${issue.message}
                                ${issue.value !== null ? ` <code>${JSON.stringify(issue.value)}</code>` : ''}
                            </div>
                        </div>
                    `).join('')}
                    ${entry.warnings.map(warning => `
                        <div class="issue warning">
                            <div class="issue-icon">⚠</div>
                            <div class="issue-text">
                                <span class="issue-field">${warning.field}:</span> ${warning.message}
                                ${warning.value !== null ? ` <code>${JSON.stringify(warning.value)}</code>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="entry-actions">
                <button class="action-btn edit" onclick="openEditModal('${entry.entryId}')">Edit</button>
                <button class="action-btn history" onclick="viewHistory('${entry.entryId}')">History</button>
                <button class="action-btn delete" onclick="deleteEntry('${entry.entryId}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
    document.getElementById('summarySection').style.display = show ? 'none' : 'block';
}
